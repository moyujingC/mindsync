import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readJsonFile } from '../utils/json-file.mjs';

export async function buildDailySummary({
  date,
  runsDir,
  topicDir,
  accountsRoot,
  outputPath,
}) {
  const runReports = await loadRunReports({ runsDir, date });
  const topicBatches = await loadTopicBatches({ topicDir, date });
  const accountArtifacts = await loadAccountArtifacts({ accountsRoot, date });

  const summary = {
    date,
    runCount: runReports.length,
    createdContentCount: sum(runReports.map((report) => report.summary?.createdCount ?? 0)),
    duplicateContentCount: sum(runReports.map((report) => report.summary?.duplicateCount ?? 0)),
    failedRunCount: sum(runReports.map((report) => report.summary?.failedCount ?? 0)),
    topicBatchCount: topicBatches.length,
    topicCandidateCount: sum(topicBatches.map((batch) => batch.count ?? 0)),
    briefCount: accountArtifacts.briefCount,
    draftCount: accountArtifacts.draftCount,
    finalDraftCount: accountArtifacts.finalDraftCount,
    failedCreators: collectFailedCreators(runReports),
  };

  const markdown = renderDailySummaryMarkdown({ summary, runReports, topicBatches, accountArtifacts });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${markdown}\n`, 'utf8');

  return {
    outputPath,
    summary,
  };
}

async function loadRunReports({ runsDir, date }) {
  const dir = join(runsDir, date);
  const files = await safeReadDir(dir);
  return Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .sort()
      .map((file) => readJsonFile(join(dir, file))),
  );
}

async function loadTopicBatches({ topicDir, date }) {
  const files = await safeReadDir(topicDir);
  return Promise.all(
    files
      .filter((file) => file.startsWith(date) && file.endsWith('.json'))
      .sort()
      .map((file) => readJsonFile(join(topicDir, file))),
  );
}

async function loadAccountArtifacts({ accountsRoot, date }) {
  const accounts = await safeReadDir(accountsRoot);
  const stats = {
    briefCount: 0,
    draftCount: 0,
    finalDraftCount: 0,
    files: [],
  };

  for (const account of accounts) {
    const accountDir = join(accountsRoot, account);
    if (!await isDirectory(accountDir)) {
      continue;
    }
    const files = await safeReadDir(accountDir);
    for (const file of files) {
      if (!file.startsWith(date) || !file.endsWith('.md')) {
        continue;
      }
      stats.files.push({ account, file });
      if (file.endsWith('-草稿.md')) {
        stats.draftCount += 1;
      } else if (file.endsWith('-成稿.md')) {
        stats.finalDraftCount += 1;
      }
    }
  }

  return stats;
}

function renderDailySummaryMarkdown({ summary, runReports, topicBatches, accountArtifacts }) {
  return [
    `# AI 营销获客系统每日摘要（${summary.date}）`,
    '',
    '## 总览',
    '',
    `- 运行报告数：${summary.runCount}`,
    `- 新增内容数：${summary.createdContentCount}`,
    `- 重复内容数：${summary.duplicateContentCount}`,
    `- 失败运行数：${summary.failedRunCount}`,
    `- 选题批次数：${summary.topicBatchCount}`,
    `- 选题候选数：${summary.topicCandidateCount}`,
    `- 账号草稿数：${summary.draftCount}`,
    `- 账号成稿骨架数：${summary.finalDraftCount}`,
    '',
    '## 运行报告',
    '',
    listOrFallback(
      runReports.map((report) => {
        const startedAt = report.summary?.startedAt ?? report.generatedAt;
        return `${startedAt} | 新增 ${report.summary?.createdCount ?? 0} | 重复 ${report.summary?.duplicateCount ?? 0} | 失败 ${report.summary?.failedCount ?? 0}`;
      }),
      '今天没有运行报告。',
    ),
    '',
    '## 失败账号',
    '',
    listOrFallback(summary.failedCreators, '今天没有失败账号。'),
    '',
    '## 选题批次',
    '',
    listOrFallback(
      topicBatches.map((batch) => `${batch.generatedAt ?? 'unknown'} | 候选 ${batch.count ?? 0}`),
      '今天没有选题批次。',
    ),
    '',
    '## 账号产物',
    '',
    listOrFallback(
      accountArtifacts.files.map((item) => `${item.account} / ${item.file}`),
      '今天没有账号目录产物。',
    ),
    '',
  ].join('\n');
}

function collectFailedCreators(runReports) {
  return runReports.flatMap((report) =>
    (report.creators ?? [])
      .filter((creator) => creator.failed)
      .map((creator) => `${creator.creatorName} | ${creator.error ?? 'unknown error'}`),
  );
}

function listOrFallback(items, fallback) {
  if (!items.length) {
    return `- ${fallback}`;
  }
  return items.map((item) => `- ${item}`).join('\n');
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

async function safeReadDir(dir) {
  try {
    return await readdir(dir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function isDirectory(path) {
  try {
    const value = await stat(path);
    return value.isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}
