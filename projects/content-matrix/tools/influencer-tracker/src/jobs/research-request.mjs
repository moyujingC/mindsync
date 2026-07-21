import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildContentEnrichment } from './enrich-content.mjs';
import { ResearchRequestStore } from '../storage/research-request-store.mjs';
import { extractFeishuTextField, mapResearchRequestToFeishuFields } from '../feishu/client.mjs';
import { applyResearchTemplate } from '../orchestration/research-templates.mjs';
import { normalizePlatformId } from '../platforms/platform-id.mjs';

const CANDIDATE_STATUSES = new Set(['待人工审核', '已转选题', '已发布', '已结束']);

export async function runResearchRequest({
  request,
  collect,
  outputDir = 'logs/research-briefs',
  ledgerPath = 'logs/research-requests.json',
  feishuClient = null,
  feishuConfig = null,
  persist = true,
}) {
  request = applyResearchTemplate({
    templateId: request?.templateId,
    request,
    projectName: request?.projectName,
  });
  validateResearchRequest(request);
  request = {
    ...request,
    collect: {
      ...request.collect,
      platform: normalizePlatformId(request.collect?.platform, 'research request platform'),
    },
  };
  const requestId = request.requestId ?? createRequestId();
  const store = new ResearchRequestStore({ filePath: ledgerPath });
  if (persist) {
    await store.load();
    const existing = store.get(requestId);
    if (existing) {
      return syncResearchRequestToFeishu({ request: existing, feishuClient, feishuConfig });
    }
  }
  const collection = await collect(request.collect);
  const candidates = buildCandidates({ request, collection });
  const result = {
    schema: 'content-matrix/research-request/v1',
    requestId,
    generatedAt: new Date().toISOString(),
    purpose: request.purpose,
    serviceDirection: request.serviceDirection,
    targetAccount: request.targetAccount ?? null,
    orchestration: request.orchestration ?? null,
    status: '待人工确认',
    collection: summarizeCollection(collection, request.collect),
    candidates,
    nextAction: '人工确认后再进入选题、发布或样本沟通。',
  };
  if (!persist) {
    return { ...result, outputPath: null, feishu: { synced: false, reason: 'dry-run' } };
  }
  const outputPath = resolve(outputDir, `${result.requestId}.md`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderResearchBrief(result), 'utf8');
  const savedResult = { ...result, outputPath };
  store.add(savedResult);
  await store.save();
  return syncResearchRequestToFeishu({ request: savedResult, feishuClient, feishuConfig });
}

export async function confirmResearchCandidate({
  ledgerPath = 'logs/research-requests.json',
  requestId,
  candidateIndex,
  action,
  decisionNote,
  verificationEvidence,
  feishuClient = null,
  feishuConfig = null,
}) {
  if (!requestId) {
    throw new Error('Missing requestId');
  }
  if (!Number.isInteger(candidateIndex) || candidateIndex < 1) {
    throw new Error('candidateIndex must be a positive integer');
  }

  const store = new ResearchRequestStore({ filePath: ledgerPath });
  await store.load();
  const updated = store.update(requestId, (request) => {
    const candidate = request.candidates?.[candidateIndex - 1];
    if (!candidate) {
      throw new Error(`Research candidate not found: ${candidateIndex}`);
    }
    applyCandidateDecision({ candidate, action, decisionNote, verificationEvidence });
    const now = new Date().toISOString();
    const status = deriveRequestStatus(request.candidates);
    return {
      ...request,
      status,
      updatedAt: now,
      decisions: [...(request.decisions ?? []), {
        candidateIndex,
        action,
        decisionNote: decisionNote ?? null,
        verificationEvidence: verificationEvidence ?? null,
        decidedAt: now,
      }],
    };
  });
  await store.save();
  await writeFile(updated.outputPath, renderResearchBrief(updated), 'utf8');
  return syncResearchRequestToFeishu({ request: updated, feishuClient, feishuConfig });
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
      transcript: content.refinedText ?? '',
      comments: relatedComments,
    });
    const candidate = enrichment.topicCandidates[0];
    return {
      source: {
        contentUniqueKey: content.uniqueKey,
        title: content.title,
        url: content.url,
        commentUniqueKeys: relatedComments.map((comment) => comment.commentUniqueKey),
        refinedText: content.researchEvidence ? {
          path: content.researchEvidence.refinedTextPath,
          characterCount: content.researchEvidence.characterCount,
        } : null,
      },
      evidenceLevel: evidenceLevelFor({ content, comments: relatedComments }),
      conclusionLevel: '假设',
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
  if (content.title || content.description) {
    return '线索';
  }
  return '线索';
}

function summarizeCollection(collection, requestCollect) {
  return {
    mode: collection.request?.mode,
    platform: collection.request?.platform,
    contentCount: collection.contents?.fetchedCount ?? 0,
    commentCount: collection.comments?.fetchedCount ?? 0,
    requestCount: collection.audit?.requestCount ?? 0,
    cacheUrls: collection.audit?.cacheUrls ?? [],
    sampleLimit: requestCollect?.limit ?? collection.request?.limit ?? null,
  };
}

export async function syncResearchRequestToFeishu({ request, feishuClient, feishuConfig }) {
  if (!feishuClient || !feishuConfig?.tables?.researchRequests) {
    return { ...request, feishu: { synced: false, reason: 'not-configured' } };
  }
  const fields = feishuConfig.tables.researchRequests.fields;
  const records = typeof feishuClient.listRecordsByField === 'function'
    ? await feishuClient.listRecordsByField('researchRequests', fields.requestId, request.requestId, [fields.requestId])
    : await feishuClient.listRecords('researchRequests');
  const existing = records.find((record) => extractFeishuTextField(record, fields.requestId) === request.requestId);
  const mappedFields = mapResearchRequestToFeishuFields(request, fields);
  if (existing?.record_id) {
    await feishuClient.updateRecord('researchRequests', existing.record_id, mappedFields);
    return { ...request, feishu: { synced: true, action: 'updated', recordId: existing.record_id } };
  }
  const recordIds = await feishuClient.createRecords('researchRequests', [mappedFields]);
  return { ...request, feishu: { synced: true, action: 'created', recordId: recordIds[0] ?? null } };
}

export function renderResearchBrief(result) {
  const lines = [
    `# 研究简报：${result.requestId}`,
    '',
    `- 生成时间：${result.generatedAt}`,
    `- 研究目的：${result.purpose}`,
    `- 服务方向：${result.serviceDirection}`,
    `- 目标账号：${result.targetAccount ?? '未指定'}`,
    `- 当前状态：${result.status}`,
  ];
  if (result.orchestration) {
    lines.push(`- 研究模板：${result.orchestration.templateName}`);
    if (result.orchestration.projectName) {
      lines.push(`- 项目代号：${result.orchestration.projectName}`);
    }
    lines.push(`- 交付重点：${result.orchestration.outputFocus}`);
    if (result.orchestration.followUpWorkflow) {
      lines.push(`- 后续工作流：${result.orchestration.followUpWorkflow}`);
    }
  }
  lines.push(
    `- 内容样本：${result.collection.contentCount}`,
    `- 评论样本：${result.collection.commentCount}`,
    `- TikHub 调用：${result.collection.requestCount}`,
    '',
  );
  if (result.orchestration?.constraints?.length) {
    lines.push('## 研究约束', '');
    result.orchestration.constraints.forEach((constraint) => lines.push(`- ${constraint}`));
    lines.push('');
  }
  lines.push('## 候选选题', '');
  if (result.candidates.length === 0) {
    lines.push('本轮没有新增内容样本，需调整研究请求或检查去重结果。');
  }
  for (const [index, candidate] of result.candidates.entries()) {
    lines.push(`### ${index + 1}. ${candidate.topicTitle}`);
    lines.push('');
    lines.push(`- 证据等级：${candidate.evidenceLevel}`);
    lines.push(`- 结论等级：${candidate.conclusionLevel}`);
    lines.push(`- 选题状态：${candidate.status}`);
    lines.push(`- 来源：${candidate.source.title}`);
    lines.push(`- 链接：${candidate.source.url ?? '未提供'}`);
    lines.push(`- 用户问题：${candidate.userProblem}`);
    lines.push(`- 证据摘要：${candidate.evidenceSummary}`);
    lines.push(`- 建议动作：${candidate.nextAction}`);
    if (candidate.source.refinedText) {
      lines.push(`- 提纯文本：${candidate.source.refinedText.path}（${candidate.source.refinedText.characterCount} 字）`);
      if (candidate.evidence.transcriptExcerpt) {
        lines.push(`- 提纯片段：${candidate.evidence.transcriptExcerpt}`);
      }
    }
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

function applyCandidateDecision({ candidate, action, decisionNote, verificationEvidence }) {
  if (!action) {
    throw new Error('Missing action');
  }
  if (!CANDIDATE_STATUSES.has(candidate.status)) {
    throw new Error(`Unsupported candidate status: ${candidate.status}`);
  }

  const now = new Date().toISOString();
  if (action === '验证') {
    if (!verificationEvidence?.trim()) {
      throw new Error('verificationEvidence is required before a conclusion can be marked 已验证');
    }
    candidate.conclusionLevel = '已验证';
    candidate.verificationEvidence = verificationEvidence.trim();
    candidate.verifiedAt = now;
    return;
  }

  const transitions = {
    转选题: { from: ['待人工审核'], to: '已转选题' },
    已发布: { from: ['已转选题'], to: '已发布' },
    结束: { from: ['待人工审核', '已转选题', '已发布'], to: '已结束' },
  };
  const transition = transitions[action];
  if (!transition) {
    throw new Error(`Unsupported decision action: ${action}`);
  }
  if (!transition.from.includes(candidate.status)) {
    throw new Error(`Research candidate cannot move directly from ${candidate.status} to ${transition.to}`);
  }
  if (!decisionNote?.trim()) {
    throw new Error(`decisionNote is required when action is ${action}`);
  }
  candidate.status = transition.to;
  candidate.decisionNote = decisionNote.trim();
  candidate.decidedAt = now;
}

function deriveRequestStatus(candidates) {
  const statuses = candidates.map((candidate) => candidate.status);
  if (statuses.length > 0 && statuses.every((status) => status === '已结束')) {
    return '已结束';
  }
  if (statuses.includes('已发布')) {
    return '已发布';
  }
  if (statuses.includes('已转选题')) {
    return '已转选题';
  }
  return '待人工确认';
}
