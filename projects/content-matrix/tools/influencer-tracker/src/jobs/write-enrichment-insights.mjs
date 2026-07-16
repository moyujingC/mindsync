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
  return writeEnrichmentPathsToFeishu({
    enrichmentPaths,
    rootDir,
    feishuPath,
    reportPath,
    markProcessed,
  });
}

export async function writeFailedEnrichmentInsightsToFeishu({
  reportPath,
  feishuPath,
  retryReportPath = null,
  markProcessed = false,
}) {
  const sourceReport = await readJsonFile(reportPath);
  const enrichmentPaths = extractFailedEnrichmentPaths(sourceReport);

  return writeEnrichmentPathsToFeishu({
    enrichmentPaths,
    rootDir: sourceReport.rootDir,
    feishuPath,
    reportPath: retryReportPath,
    markProcessed,
    retrySourceReportPath: reportPath,
  });
}

async function writeEnrichmentPathsToFeishu({
  enrichmentPaths,
  rootDir = null,
  feishuPath,
  reportPath = null,
  markProcessed = false,
  retrySourceReportPath = null,
}) {
  const loaded = await loadEnrichmentsSafely(enrichmentPaths);
  const validItems = loaded.filter((item) => item.ok);
  const candidatesByEnrichment = validItems.map((item) => buildInsightCandidatesFromEnrichment(item.enrichment)
    .map((candidate) => ({
      ...candidate,
      source: {
        ...candidate.source,
        enrichmentPath: item.enrichmentPath,
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
    loaded,
    candidatesByEnrichment,
    feishu,
    retrySourceReportPath,
  });

  if (reportPath) {
    await writeJsonFile(reportPath, report);
  }
  if (markProcessed) {
    await Promise.all(loaded
      .filter((item) => item.ok)
      .map((item) => writeJsonFile(item.enrichmentPath, {
        ...item.enrichment,
        handoff: report.items.find((reportItem) => reportItem.enrichmentPath === item.enrichmentPath),
      })));
  }

  return {
    enabled: feishu.enabled,
    enrichmentCount: validItems.length,
    failedCount: loaded.filter((item) => !item.ok).length,
    retryCount: retrySourceReportPath ? enrichmentPaths.length : undefined,
    retrySourceReportPath,
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

async function loadEnrichmentsSafely(enrichmentPaths) {
  return Promise.all(enrichmentPaths.map(async (enrichmentPath) => {
    try {
      return {
        ok: true,
        enrichmentPath,
        enrichment: await readJsonFile(enrichmentPath),
      };
    } catch (error) {
      return {
        ok: false,
        enrichmentPath,
        error: error.message,
      };
    }
  }));
}

function buildEnrichmentWriteReport({
  rootDir,
  feishuPath,
  loaded,
  candidatesByEnrichment,
  feishu,
  retrySourceReportPath = null,
}) {
  const recordIds = feishu.recordIds ?? [];
  let createdCursor = 0;
  let validIndex = 0;
  const items = loaded.map((item) => {
    if (!item.ok) {
      return {
        enrichmentPath: item.enrichmentPath,
        status: 'failed',
        candidateCount: 0,
        createdCount: 0,
        duplicateCount: 0,
        recordIds: [],
        error: item.error,
        processedAt: new Date().toISOString(),
      };
    }
    const index = validIndex;
    validIndex += 1;
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
      enrichmentPath: item.enrichmentPath,
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
    retrySourceReportPath,
    retryCount: retrySourceReportPath ? loaded.length : undefined,
    feishuEnabled: Boolean(feishuPath),
    enrichmentCount: loaded.filter((item) => item.ok).length,
    failedCount: loaded.filter((item) => !item.ok).length,
    inputCount: candidatesByEnrichment.flat().length,
    createdCount: feishu.createdCount ?? 0,
    duplicateCount: feishu.duplicateCount ?? 0,
    recordIds,
    items,
  };
}

function extractFailedEnrichmentPaths(report) {
  return (report.items ?? [])
    .filter((item) => item.status === 'failed')
    .map((item) => item.enrichmentPath)
    .filter(Boolean);
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
