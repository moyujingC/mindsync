import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readJsonFile } from '../utils/json-file.mjs';

export async function buildWeeklyReview({
  startDate,
  endDate,
  runsDir,
  topicDir,
  accountsRoot,
  feedbackRoot,
  outputPath,
}) {
  const dates = enumerateDates(startDate, endDate);
  const runReports = await loadRunReports({ runsDir, dates });
  const topicBatches = await loadTopicBatches({ topicDir, dates });
  const accountArtifacts = await loadAccountArtifacts({ accountsRoot, dates });
  const feedbackStats = await loadFeedbackStats({ feedbackRoot, dates });

  const summary = {
    startDate,
    endDate,
    coveredDays: dates.length,
    reportDays: new Set(runReports.map((report) => report.generatedAt?.slice(0, 10))).size,
    runCount: runReports.length,
    createdContentCount: sum(runReports.map((report) => report.summary?.createdCount ?? 0)),
    duplicateContentCount: sum(runReports.map((report) => report.summary?.duplicateCount ?? 0)),
    failedRunCount: sum(runReports.map((report) => report.summary?.failedCount ?? 0)),
    topicBatchCount: topicBatches.length,
    topicCandidateCount: sum(topicBatches.map((batch) => batch.count ?? 0)),
    briefCount: accountArtifacts.briefCount,
    draftCount: accountArtifacts.draftCount,
    finalDraftCount: accountArtifacts.finalDraftCount,
    feedbackCount: feedbackStats.feedbackCount,
    sampleConversationCount: feedbackStats.sampleConversationCount,
    failedCreators: collectFailedCreators(runReports),
  };

  const markdown = renderWeeklyReviewMarkdown({ summary, runReports, topicBatches, accountArtifacts, feedbackStats });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${markdown}\n`, 'utf8');

  return {
    outputPath,
    summary,
  };
}

async function loadRunReports({ runsDir, dates }) {
  const reports = [];
  for (const date of dates) {
    const dir = join(runsDir, date);
    const files = await safeReadDir(dir);
    const parsed = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => readJsonFile(join(dir, file))),
    );
    reports.push(...parsed);
  }
  return reports;
}

async function loadTopicBatches({ topicDir, dates }) {
  const files = await safeReadDir(topicDir);
  const dateSet = new Set(dates);
  return Promise.all(
    files
      .filter((file) => file.endsWith('.json') && dateSet.has(file.slice(0, 10)))
      .sort()
      .map((file) => readJsonFile(join(topicDir, file))),
  );
}

async function loadAccountArtifacts({ accountsRoot, dates }) {
  const accounts = await safeReadDir(accountsRoot);
  const dateSet = new Set(dates);
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
      if (!file.endsWith('.md') || !dateSet.has(file.slice(0, 10))) {
        continue;
      }
      stats.files.push({ account, file });
      if (file.endsWith('-brief.md')) {
        stats.briefCount += 1;
      } else if (file.endsWith('-草稿.md')) {
        stats.draftCount += 1;
      } else if (file.endsWith('-成稿.md')) {
        stats.finalDraftCount += 1;
      }
    }
  }

  return stats;
}

async function loadFeedbackStats({ feedbackRoot, dates }) {
  if (!feedbackRoot) {
    return {
      feedbackCount: 0,
      sampleConversationCount: 0,
      files: [],
    };
  }

  const files = await safeReadDir(feedbackRoot);
  const dateSet = new Set(dates);
  const matched = files.filter((file) => file.endsWith('-发布反馈.md') && dateSet.has(file.slice(0, 10)));
  let sampleConversationCount = 0;

  for (const file of matched) {
    const raw = await readMarkdownIfExists(join(feedbackRoot, file));
    if (raw.includes('是否进入样本沟通：是')) {
      sampleConversationCount += 1;
    }
  }

  return {
    feedbackCount: matched.length,
    sampleConversationCount,
    files: matched,
  };
}

function renderWeeklyReviewMarkdown({ summary, runReports, topicBatches, accountArtifacts, feedbackStats }) {
  return [
    `# 历史运行汇总（${summary.startDate} ~ ${summary.endDate}）`,
    '',
    '## 总览',
    '',
    `- 覆盖天数：${summary.coveredDays}`,
    `- 有运行报告的天数：${summary.reportDays}`,
    `- 运行报告数：${summary.runCount}`,
    `- 新增内容数：${summary.createdContentCount}`,
    `- 重复内容数：${summary.duplicateContentCount}`,
    `- 失败运行数：${summary.failedRunCount}`,
    `- 选题批次数：${summary.topicBatchCount}`,
    `- 选题候选数：${summary.topicCandidateCount}`,
    `- brief 数：${summary.briefCount}`,
    `- 账号草稿数：${summary.draftCount}`,
    `- 账号成稿骨架数：${summary.finalDraftCount}`,
    `- 发布反馈记录数：${summary.feedbackCount}`,
    `- 进入样本沟通数：${summary.sampleConversationCount}`,
    '',
    '## 本周运行报告',
    '',
    listOrFallback(
      runReports.map((report) => {
        const startedAt = report.summary?.startedAt ?? report.generatedAt;
        return `${startedAt} | 新增 ${report.summary?.createdCount ?? 0} | 重复 ${report.summary?.duplicateCount ?? 0} | 失败 ${report.summary?.failedCount ?? 0}`;
      }),
      '本周没有运行报告。',
    ),
    '',
    '## 本周失败账号',
    '',
    listOrFallback(summary.failedCreators, '本周没有失败账号。'),
    '',
    '## 本周选题批次',
    '',
    listOrFallback(
      topicBatches.map((batch) => `${batch.generatedAt ?? 'unknown'} | 候选 ${batch.count ?? 0}`),
      '本周没有选题批次。',
    ),
    '',
    '## 本周账号产物',
    '',
    listOrFallback(
      accountArtifacts.files.map((item) => `${item.account} / ${item.file}`),
      '本周没有账号目录产物。',
    ),
    '',
    '## 本周发布反馈',
    '',
    listOrFallback(
      feedbackStats.files,
      '本周没有发布反馈记录。',
    ),
    '',
    '## 本周复盘问题',
    '',
    '- 哪些新增内容真实进入了选题池？',
    '- 哪些选题已经进入 brief / 草稿 / 成稿？',
    '- 哪些失败账号需要人工修复数据源？',
    '- 哪些信号真正推进了企业 AI 服务的内容获客？',
    '- 本文件只汇总历史运行，不生成下一轮研究请求、选题或服务决策。',
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

function enumerateDates(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
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

export async function readMarkdownIfExists(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}
