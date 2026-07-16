import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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
  markdownReportPath = null,
  markProcessed = false,
  date = null,
  creator = null,
}) {
  const enrichmentPaths = filterEnrichmentPaths(await findEnrichmentFiles(rootDir), {
    date,
    creator,
  });
  return writeEnrichmentPathsToFeishu({
    enrichmentPaths,
    rootDir,
    feishuPath,
    reportPath,
    markdownReportPath,
    markProcessed,
    filters: {
      date,
      creator,
    },
  });
}

export async function writeFailedEnrichmentInsightsToFeishu({
  reportPath,
  feishuPath,
  retryReportPath = null,
  markdownReportPath = null,
  markProcessed = false,
}) {
  const sourceReport = await readJsonFile(reportPath);
  const enrichmentPaths = extractFailedEnrichmentPaths(sourceReport);

  return writeEnrichmentPathsToFeishu({
    enrichmentPaths,
    rootDir: sourceReport.rootDir,
    feishuPath,
    reportPath: retryReportPath,
    markdownReportPath,
    markProcessed,
    retrySourceReportPath: reportPath,
  });
}

async function writeEnrichmentPathsToFeishu({
  enrichmentPaths,
  rootDir = null,
  feishuPath,
  reportPath = null,
  markdownReportPath = null,
  markProcessed = false,
  retrySourceReportPath = null,
  filters = {},
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
  const writeResult = await writeCandidatesWithFallback({
    candidates,
    candidatesByEnrichment,
    feishuPath,
  });
  const report = buildEnrichmentWriteReport({
    rootDir,
    feishuPath,
    loaded,
    candidatesByEnrichment,
    feishu: writeResult.feishu,
    itemWriteResults: writeResult.itemResults,
    reportPath,
    retrySourceReportPath,
    filters,
  });

  if (reportPath) {
    await writeJsonFile(reportPath, report);
  }
  if (markdownReportPath) {
    await writeMarkdownFile(markdownReportPath, buildEnrichmentWriteMarkdownReport(report));
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
    enabled: writeResult.feishu.enabled,
    enrichmentCount: validItems.length,
    failedCount: report.failedCount,
    retryCount: retrySourceReportPath ? enrichmentPaths.length : undefined,
    retrySourceReportPath,
    filters,
    inputCount: candidates.length,
    createdCount: writeResult.feishu.createdCount,
    duplicateCount: writeResult.feishu.duplicateCount ?? 0,
    recordIds: writeResult.feishu.recordIds,
    batchWriteFailed: writeResult.batchWriteFailed,
    batchWriteError: writeResult.batchWriteError,
    reportPath,
    markdownReportPath,
    report,
    enrichmentPaths,
    candidates,
  };
}

export function buildEnrichmentWriteMarkdownReport(report) {
  const failedItems = report.items.filter((item) => item.status === 'failed');
  const retryCommand = buildRetryCommand(report);
  const lines = [
    '# Enrichment 写入报告',
    '',
    `- 生成时间：${report.generatedAt}`,
    `- 根目录：${report.rootDir ?? '未记录'}`,
    `- 飞书写入：${report.feishuEnabled ? '启用' : '未启用'}`,
    `- Enrichment 数：${report.enrichmentCount}`,
    `- 候选数：${report.inputCount}`,
    `- 新建数：${report.createdCount}`,
    `- 重复数：${report.duplicateCount}`,
    `- 失败数：${report.failedCount}`,
  ];

  if (report.retrySourceReportPath) {
    lines.push(`- 重试来源：${report.retrySourceReportPath}`);
    lines.push(`- 重试项数：${report.retryCount ?? 0}`);
  }

  lines.push('');
  lines.push('## 状态汇总');
  lines.push('');
  for (const [status, count] of Object.entries(countItemsByStatus(report.items))) {
    lines.push(`- ${status}: ${count}`);
  }

  lines.push('');
  lines.push('## 失败项');
  lines.push('');

  if (failedItems.length === 0) {
    lines.push('无失败项。');
  } else {
    failedItems.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.enrichmentPath}`);
      lines.push('');
      lines.push(`- 候选数：${item.candidateCount}`);
      lines.push(`- 错误：${item.error ?? '未记录'}`);
      lines.push('- 建议：修复该 enrichment 文件或字段后，使用 retry 命令只重试失败项。');
      lines.push('');
    });
  }

  lines.push('## 重试命令');
  lines.push('');
  if (retryCommand) {
    lines.push('```bash');
    lines.push(retryCommand);
    lines.push('```');
  } else {
    lines.push('本报告没有 `reportPath`，无法自动生成重试命令。');
  }

  return `${lines.join('\n')}\n`;
}

async function writeCandidatesWithFallback({
  candidates,
  candidatesByEnrichment,
  feishuPath,
}) {
  try {
    return {
      feishu: await writeTopicCandidatesToFeishu({
        candidates,
        feishuPath,
      }),
      itemResults: null,
      batchWriteFailed: false,
      batchWriteError: null,
    };
  } catch (error) {
    const itemResults = await Promise.all(candidatesByEnrichment.map(async (itemCandidates) => {
      try {
        const feishu = await writeTopicCandidatesToFeishu({
          candidates: itemCandidates,
          feishuPath,
        });
        return {
          ok: true,
          feishu,
        };
      } catch (itemError) {
        return {
          ok: false,
          error: itemError.message,
          feishu: {
            enabled: Boolean(feishuPath),
            createdCount: 0,
            duplicateCount: 0,
            recordIds: [],
          },
        };
      }
    }));

    return {
      feishu: combineItemWriteResults({ itemResults, feishuPath }),
      itemResults,
      batchWriteFailed: true,
      batchWriteError: error.message,
    };
  }
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

export function filterEnrichmentPaths(enrichmentPaths, { date = null, creator = null } = {}) {
  return enrichmentPaths.filter((enrichmentPath) => {
    if (date && !pathContainsSegmentOrText(enrichmentPath, date)) {
      return false;
    }
    if (creator && !pathContainsSegmentOrText(enrichmentPath, creator)) {
      return false;
    }
    return true;
  });
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

function pathContainsSegmentOrText(filePath, value) {
  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return true;
  }
  return filePath.split(/[\\/]/).some((segment) => segment === normalizedValue)
    || filePath.includes(normalizedValue);
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
  itemWriteResults = null,
  reportPath = null,
  retrySourceReportPath = null,
  filters = {},
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
    const itemWriteResult = itemWriteResults?.[index];
    if (itemWriteResult && !itemWriteResult.ok) {
      return {
        enrichmentPath: item.enrichmentPath,
        status: 'failed',
        candidateCount: candidates.length,
        createdCount: 0,
        duplicateCount: 0,
        recordIds: [],
        error: itemWriteResult.error,
        processedAt: new Date().toISOString(),
      };
    }
    const duplicateCount = itemWriteResult
      ? itemWriteResult.feishu.duplicateCount ?? 0
      : estimateDuplicateCount({
      candidateCount: candidates.length,
      totalCandidateCount: candidatesByEnrichment.flat().length,
      totalDuplicateCount: feishu.duplicateCount ?? 0,
    });
    const createdCount = itemWriteResult
      ? itemWriteResult.feishu.createdCount ?? 0
      : feishu.enabled === false ? 0 : Math.max(0, candidates.length - duplicateCount);
    const itemRecordIds = itemWriteResult
      ? itemWriteResult.feishu.recordIds ?? []
      : recordIds.slice(createdCursor, createdCursor + createdCount);
    if (!itemWriteResult) {
      createdCursor += createdCount;
    }
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
    reportPath,
    filters: compactFilters(filters),
    retrySourceReportPath,
    retryCount: retrySourceReportPath ? loaded.length : undefined,
    feishuEnabled: Boolean(feishuPath),
    enrichmentCount: loaded.filter((item) => item.ok).length,
    failedCount: items.filter((item) => item.status === 'failed').length,
    inputCount: candidatesByEnrichment.flat().length,
    createdCount: feishu.createdCount ?? 0,
    duplicateCount: feishu.duplicateCount ?? 0,
    recordIds,
    items,
  };
}

function combineItemWriteResults({ itemResults, feishuPath }) {
  return {
    enabled: Boolean(feishuPath),
    createdCount: itemResults.reduce((total, item) => total + (item.feishu.createdCount ?? 0), 0),
    duplicateCount: itemResults.reduce((total, item) => total + (item.feishu.duplicateCount ?? 0), 0),
    recordIds: itemResults.flatMap((item) => item.feishu.recordIds ?? []),
  };
}

function compactFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  );
}

async function writeMarkdownFile(filePath, content) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

function countItemsByStatus(items) {
  return items.reduce((counts, item) => ({
    ...counts,
    [item.status]: (counts[item.status] ?? 0) + 1,
  }), {});
}

function buildRetryCommand(report) {
  const sourceReportPath = report.reportPath ?? report.retrySourceReportPath;
  if (!sourceReportPath) {
    return '';
  }
  return [
    'node src/cli/retry-failed-enrichment-insights.mjs',
    `  --report ${sourceReportPath}`,
    '  --retry-report logs/enrichment-writes/retry.json',
  ].join(' \\\n');
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
