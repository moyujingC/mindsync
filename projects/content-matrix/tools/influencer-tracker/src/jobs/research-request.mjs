import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildContentEnrichment } from './enrich-content.mjs';

export async function runResearchRequest({ request, collect, outputDir = 'logs/research-briefs' }) {
  validateResearchRequest(request);
  const collection = await collect(request.collect);
  const candidates = buildCandidates({ request, collection });
  const result = {
    schema: 'content-matrix/research-request/v1',
    requestId: request.requestId ?? createRequestId(),
    generatedAt: new Date().toISOString(),
    purpose: request.purpose,
    serviceDirection: request.serviceDirection,
    targetAccount: request.targetAccount ?? null,
    status: '待人工确认',
    collection: summarizeCollection(collection),
    candidates,
    nextAction: '人工确认后再进入选题、发布或样本沟通。',
  };
  const outputPath = resolve(outputDir, `${result.requestId}.md`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderResearchBrief(result), 'utf8');
  return { ...result, outputPath };
}

function validateResearchRequest(request) {
  if (!request?.purpose || !request?.serviceDirection) {
    throw new Error('Research request requires purpose and serviceDirection');
  }
  if (!request.collect?.mode || !request.collect?.platform) {
    throw new Error('Research request requires collect.mode and collect.platform');
  }
}

function buildCandidates({ request, collection }) {
  return (collection.contents?.items ?? []).map((content) => {
    const relatedComments = (collection.comments?.items ?? [])
      .filter((comment) => comment.contentUniqueKey === content.uniqueKey || !comment.contentUniqueKey);
    const enrichment = buildContentEnrichment({
      metadata: content,
      comments: relatedComments,
    });
    const candidate = enrichment.topicCandidates[0];
    return {
      source: {
        contentUniqueKey: content.uniqueKey,
        title: content.title,
        url: content.url,
        commentUniqueKeys: relatedComments.map((comment) => comment.commentUniqueKey),
      },
      evidenceLevel: evidenceLevelFor({ content, comments: relatedComments }),
      researchPurpose: request.purpose,
      serviceDirection: request.serviceDirection,
      targetAccount: request.targetAccount ?? null,
      topicTitle: candidate.topicTitle,
      userProblem: candidate.userProblem,
      evidenceSummary: candidate.evidenceSummary,
      nextAction: candidate.nextAction,
      status: '待人工审核',
      evidence: enrichment.evidence,
    };
  }).slice(0, 3);
}

function evidenceLevelFor({ content, comments }) {
  if (comments.length >= 2) {
    return '观察';
  }
  if (content.description) {
    return '线索';
  }
  return '待补充';
}

function summarizeCollection(collection) {
  return {
    mode: collection.request?.mode,
    platform: collection.request?.platform,
    contentCount: collection.contents?.fetchedCount ?? 0,
    commentCount: collection.comments?.fetchedCount ?? 0,
    requestCount: collection.audit?.requestCount ?? 0,
    cacheUrls: collection.audit?.cacheUrls ?? [],
  };
}

function renderResearchBrief(result) {
  const lines = [
    `# 研究简报：${result.requestId}`,
    '',
    `- 生成时间：${result.generatedAt}`,
    `- 研究目的：${result.purpose}`,
    `- 服务方向：${result.serviceDirection}`,
    `- 目标账号：${result.targetAccount ?? '未指定'}`,
    `- 当前状态：${result.status}`,
    `- 内容样本：${result.collection.contentCount}`,
    `- 评论样本：${result.collection.commentCount}`,
    `- TikHub 调用：${result.collection.requestCount}`,
    '',
    '## 候选选题',
    '',
  ];
  if (result.candidates.length === 0) {
    lines.push('本轮没有新增内容样本，需调整研究请求或检查去重结果。');
  }
  for (const [index, candidate] of result.candidates.entries()) {
    lines.push(`### ${index + 1}. ${candidate.topicTitle}`);
    lines.push('');
    lines.push(`- 证据等级：${candidate.evidenceLevel}`);
    lines.push(`- 来源：${candidate.source.title}`);
    lines.push(`- 链接：${candidate.source.url ?? '未提供'}`);
    lines.push(`- 用户问题：${candidate.userProblem}`);
    lines.push(`- 证据摘要：${candidate.evidenceSummary}`);
    lines.push(`- 建议动作：${candidate.nextAction}`);
    const comments = candidate.evidence.topComments ?? [];
    if (comments.length > 0) {
      lines.push('- 评论证据：');
      comments.forEach((comment) => lines.push(`  - ${comment.commentText}`));
    }
    lines.push('');
  }
  lines.push('## 人工确认');
  lines.push('');
  lines.push(result.nextAction);
  return `${lines.join('\n')}\n`;
}

function createRequestId() {
  return `research-${new Date().toISOString().replace(/[:.]/g, '-')}`;
}
