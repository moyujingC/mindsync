import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readJsonFile, writeJsonFile } from '../utils/json-file.mjs';
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

export async function writeEnrichmentDirectoryInsightsToFeishu({
  rootDir,
  feishuPath,
  reportPath = null,
  markProcessed = false,
}) {
  const enrichmentPaths = await findEnrichmentFiles(rootDir);
  const enrichments = await Promise.all(enrichmentPaths.map((path) => readJsonFile(path)));
  const candidatesByEnrichment = enrichments.map((enrichment, index) => buildInsightCandidatesFromEnrichment(enrichment)
    .map((candidate) => ({
      ...candidate,
      source: {
        ...candidate.source,
        enrichmentPath: enrichmentPaths[index],
      },
    })));
  const candidates = candidatesByEnrichment.flat();
  const feishu = await writeTopicCandidatesToFeishu({
    candidates,
    feishuPath,
  });
  const report = buildEnrichmentWriteReport({
    rootDir,
    feishuPath,
    enrichmentPaths,
    candidatesByEnrichment,
    feishu,
  });

  if (reportPath) {
    await writeJsonFile(reportPath, report);
  }
  if (markProcessed) {
    await Promise.all(enrichments.map((enrichment, index) => writeJsonFile(enrichmentPaths[index], {
      ...enrichment,
      handoff: report.items[index],
    })));
  }

  return {
    enabled: feishu.enabled,
    enrichmentCount: enrichments.length,
    inputCount: candidates.length,
    createdCount: feishu.createdCount,
    duplicateCount: feishu.duplicateCount ?? 0,
    recordIds: feishu.recordIds,
    reportPath,
    report,
    enrichmentPaths,
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

export async function findEnrichmentFiles(rootDir) {
  const files = [];
  await walk(rootDir, files);
  return files
    .filter((filePath) => filePath.endsWith('/enrichment.json'))
    .sort();
}

async function walk(dir, files) {
  const entries = await safeReadDir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
}

async function safeReadDir(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
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

function buildEnrichmentWriteReport({
  rootDir,
  feishuPath,
  enrichmentPaths,
  candidatesByEnrichment,
  feishu,
}) {
  const recordIds = feishu.recordIds ?? [];
  let createdCursor = 0;
  const items = enrichmentPaths.map((enrichmentPath, index) => {
    const candidates = candidatesByEnrichment[index] ?? [];
    const duplicateCount = estimateDuplicateCount({
      candidateCount: candidates.length,
      totalCandidateCount: candidatesByEnrichment.flat().length,
      totalDuplicateCount: feishu.duplicateCount ?? 0,
    });
    const createdCount = feishu.enabled === false ? 0 : Math.max(0, candidates.length - duplicateCount);
    const itemRecordIds = recordIds.slice(createdCursor, createdCursor + createdCount);
    createdCursor += createdCount;
    return {
      enrichmentPath,
      status: buildItemStatus({ feishuEnabled: feishu.enabled, createdCount, duplicateCount }),
      candidateCount: candidates.length,
      createdCount,
      duplicateCount,
      recordIds: itemRecordIds,
      processedAt: new Date().toISOString(),
    };
  });

  return {
    schema: 'content-matrix/enrichment-write-report/v1',
    generatedAt: new Date().toISOString(),
    rootDir,
    feishuEnabled: Boolean(feishuPath),
    enrichmentCount: enrichmentPaths.length,
    inputCount: candidatesByEnrichment.flat().length,
    createdCount: feishu.createdCount ?? 0,
    duplicateCount: feishu.duplicateCount ?? 0,
    recordIds,
    items,
  };
}

function estimateDuplicateCount({ candidateCount, totalCandidateCount, totalDuplicateCount }) {
  if (!totalDuplicateCount || !totalCandidateCount) {
    return 0;
  }
  return Math.min(candidateCount, totalDuplicateCount);
}

function buildItemStatus({ feishuEnabled, createdCount, duplicateCount }) {
  if (feishuEnabled === false) {
    return 'disabled';
  }
  if (createdCount > 0) {
    return 'written';
  }
  if (duplicateCount > 0) {
    return 'duplicate';
  }
  return 'empty';
}
