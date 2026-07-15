import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readJsonFile } from '../utils/json-file.mjs';

export async function buildFailureReview({
  date,
  lookbackDays = 7,
  threshold = 3,
  runsDir,
  outputPath,
  feishuClient = null,
  feishuConfig = null,
  markStatus = false,
  pauseSource = false,
}) {
  const dates = enumerateLookbackDates(date, lookbackDays);
  const reports = await loadRunReports({ runsDir, dates });
  const flaggedCreators = collectFlaggedCreators({ reports, threshold });

  const updates = [];
  if (markStatus && feishuClient && feishuConfig) {
    for (const creator of flaggedCreators) {
      updates.push(await updateCreatorManualReview(
        feishuClient,
        feishuConfig,
        creator,
        threshold,
        pauseSource,
      ));
    }
  }

  const summary = {
    date,
    lookbackDays,
    threshold,
    reportCount: reports.length,
    flaggedCount: flaggedCreators.length,
    flaggedCreators,
    updatedCount: updates.length,
  };

  const markdown = renderFailureReviewMarkdown({ summary, updates });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${markdown}\n`, 'utf8');

  return {
    outputPath,
    summary,
    updates,
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
  return reports.sort((left, right) => {
    const leftTime = Date.parse(left.generatedAt ?? left.summary?.finishedAt ?? 0);
    const rightTime = Date.parse(right.generatedAt ?? right.summary?.finishedAt ?? 0);
    return leftTime - rightTime;
  });
}

function collectFlaggedCreators({ reports, threshold }) {
  const streaks = new Map();

  for (const report of reports) {
    for (const creator of report.creators ?? []) {
      const key = creator.creatorId ?? creator.creatorName;
      const current = streaks.get(key) ?? {
        creatorId: creator.creatorId,
        creatorName: creator.creatorName,
        platform: creator.platform,
        consecutiveFailures: 0,
        latestError: '',
        lastReportAt: '',
      };

      if (creator.failed) {
        current.consecutiveFailures += 1;
        current.latestError = creator.error ?? 'unknown error';
        current.lastReportAt = report.generatedAt ?? report.summary?.finishedAt ?? '';
      } else {
        current.consecutiveFailures = 0;
        current.latestError = '';
        current.lastReportAt = report.generatedAt ?? report.summary?.finishedAt ?? current.lastReportAt;
      }

      streaks.set(key, current);
    }
  }

  return [...streaks.values()]
    .filter((creator) => creator.consecutiveFailures >= threshold)
    .sort((left, right) => right.consecutiveFailures - left.consecutiveFailures);
}

async function updateCreatorManualReview(feishuClient, feishuConfig, creator, threshold, pauseSource) {
  const fieldMap = feishuConfig.tables.creators.fields;
  const fields = {
    [fieldMap.lastCheckedAt]: new Date().toISOString(),
    [fieldMap.lastStatus]: '需人工处理',
    [fieldMap.failureReason]: `连续失败 ${creator.consecutiveFailures} 次：${creator.latestError}`,
  };
  if (pauseSource && fieldMap.enabledStatus) {
    fields[fieldMap.enabledStatus] = '暂停';
  }
  await feishuClient.updateRecord('creators', creator.creatorId, fields);
  return {
    creatorId: creator.creatorId,
    creatorName: creator.creatorName,
    threshold,
    paused: pauseSource,
  };
}

function renderFailureReviewMarkdown({ summary, updates }) {
  return [
    `# AI 营销获客系统失败账号复核（${summary.date}）`,
    '',
    '## 总览',
    '',
    `- 回看天数：${summary.lookbackDays}`,
    `- 连续失败阈值：${summary.threshold}`,
    `- 运行报告数：${summary.reportCount}`,
    `- 待人工处理账号数：${summary.flaggedCount}`,
    `- 已回写飞书账号数：${summary.updatedCount}`,
    '',
    '## 待人工处理账号',
    '',
    listOrFallback(
      summary.flaggedCreators.map((creator) =>
        `${creator.creatorName} | 平台 ${creator.platform} | 连续失败 ${creator.consecutiveFailures} 次 | ${creator.latestError}`,
      ),
      '当前没有达到阈值的失败账号。',
    ),
    '',
    '## 处理建议',
    '',
    '- 先检查数据源链接、平台账号 ID 和可访问性。',
    '- 如果是平台规则变动，可以回写 `需人工处理`，并把启用状态改成 `暂停`。',
    '- 对抖音、小红书优先切回手工导入，不要在失败状态下持续重试。',
    '',
    '## 飞书回写记录',
    '',
    listOrFallback(
      updates.map((item) => `${item.creatorName} | 已回写为需人工处理${item.paused ? '，并暂停采集' : ''}`),
      '本次没有执行飞书回写。',
    ),
    '',
  ].join('\n');
}

function listOrFallback(items, fallback) {
  if (!items.length) {
    return `- ${fallback}`;
  }
  return items.map((item) => `- ${item}`).join('\n');
}

function enumerateLookbackDates(date, lookbackDays) {
  const dates = [];
  const cursor = new Date(`${date}T00:00:00.000Z`);
  for (let index = 0; index < lookbackDays; index += 1) {
    dates.unshift(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
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
