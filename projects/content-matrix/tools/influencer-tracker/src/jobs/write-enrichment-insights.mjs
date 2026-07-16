import { readJsonFile } from '../utils/json-file.mjs';
import { writeTopicCandidatesToFeishu } from './write-topic-candidates.mjs';

export async function writeEnrichmentInsightsToFeishu({
  enrichmentPath,
  feishuPath,
}) {
  const enrichment = await readJsonFile(enrichmentPath);
  const candidates = buildInsightCandidatesFromEnrichment(enrichment);
  const feishu = await writeTopicCandidatesToFeishu({
    candidates,
    feishuPath,
  });

  return {
    enabled: feishu.enabled,
    inputCount: candidates.length,
    createdCount: feishu.createdCount,
    duplicateCount: feishu.duplicateCount ?? 0,
    recordIds: feishu.recordIds,
    candidates,
  };
}

export function buildInsightCandidatesFromEnrichment(enrichment) {
  const source = enrichment.source ?? {};
  const contentUniqueKey = buildContentUniqueKey(source);
  const commentUniqueKeys = (enrichment.evidence?.topComments ?? [])
    .map((comment) => comment.commentUniqueKey)
    .filter(Boolean);

  return [
    ...buildUserDemandCandidates({ enrichment, contentUniqueKey, commentUniqueKeys }),
    ...buildTopicCandidates({ enrichment, contentUniqueKey, commentUniqueKeys }),
  ];
}

function buildUserDemandCandidates({ enrichment, contentUniqueKey, commentUniqueKeys }) {
  return (enrichment.insights ?? []).map((insight, index) => ({
    topicTitle: insight.title,
    insightType: insight.insightType ?? '用户需求',
    serviceDirection: enrichment.primaryDirection,
    targetAccounts: targetAccountsForDirection(enrichment.primaryDirection),
    userProblem: enrichment.userProblems?.[0],
    evidenceSummary: insight.evidenceSummary,
    nextAction: [
      insight.nextAction,
      '规则版 enrich 生成，必须人工复核后再进入选题或销售判断。',
    ].join('\n'),
    source: {
      platform: enrichment.source?.platform,
      contentUniqueKey,
      contentTitle: enrichment.source?.title,
      contentUrl: enrichment.source?.url,
      commentUniqueKeys,
      enrichmentIndex: index,
    },
  }));
}

function buildTopicCandidates({ enrichment, contentUniqueKey, commentUniqueKeys }) {
  return (enrichment.topicCandidates ?? []).map((candidate, index) => ({
    ...candidate,
    insightType: '选题',
    targetAccounts: targetAccountsForDirection(candidate.serviceDirection),
    source: {
      platform: enrichment.source?.platform,
      contentUniqueKey,
      contentTitle: enrichment.source?.title,
      contentUrl: enrichment.source?.url,
      commentUniqueKeys,
      enrichmentIndex: index,
    },
  }));
}

function buildContentUniqueKey(source) {
  if (!source.platform || !source.contentExternalId) {
    return '';
  }
  return `${source.platform}:${source.contentExternalId}`;
}

function targetAccountsForDirection(direction) {
  if ([
    'AI 工作流诊断',
    'AI 文档 / 知识库整理',
    '企业 AI 落地 / FDE',
    '内容生产系统',
  ].includes(direction)) {
    return ['知行AI服务'];
  }
  return ['墨予镜'];
}
