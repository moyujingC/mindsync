import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readJsonFile } from '../utils/json-file.mjs';
import { summarizeManifestCoverage } from '../utils/manifest.mjs';

export async function buildOpsAudit({
  endDate,
  requiredDays = 7,
  runsDir,
  outputPath,
  downloadsRoot = null,
}) {
  const dates = enumerateLookbackDates(endDate, requiredDays);
  const reportsByDate = {};

  for (const date of dates) {
    const dir = join(runsDir, date);
    const files = await safeReadDir(dir);
    const reports = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => readJsonFile(join(dir, file))),
    );
    reportsByDate[date] = reports;
  }

  const missingDates = dates.filter((date) => (reportsByDate[date] ?? []).length === 0);
  const coveredDates = dates.filter((date) => (reportsByDate[date] ?? []).length > 0);
  const summary = {
    endDate,
    requiredDays,
    coveredDayCount: coveredDates.length,
    missingDayCount: missingDates.length,
    missingDates,
    passes: missingDates.length === 0,
  };
  const manifestCoverage = downloadsRoot
    ? await summarizeManifestCoverage(downloadsRoot)
    : null;

  const markdown = renderOpsAuditMarkdown({ summary, reportsByDate, dates, manifestCoverage });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${markdown}\n`, 'utf8');

  return {
    outputPath,
    summary,
    manifestCoverage,
  };
}

function renderOpsAuditMarkdown({ summary, reportsByDate, dates, manifestCoverage }) {
  return [
    `# AI 营销获客系统连续运行审计（截至 ${summary.endDate}）`,
    '',
    '## 总览',
    '',
    `- 要求连续天数：${summary.requiredDays}`,
    `- 已覆盖天数：${summary.coveredDayCount}`,
    `- 缺失天数：${summary.missingDayCount}`,
    `- 是否通过：${summary.passes ? '是' : '否'}`,
    '',
    '## 每日覆盖情况',
    '',
    ...dates.map((date) => `- ${date} | 运行报告数 ${(reportsByDate[date] ?? []).length}`),
    '',
    '## 缺失日期',
    '',
    ...(summary.missingDates.length
      ? summary.missingDates.map((date) => `- ${date}`)
      : ['- 无']),
    '',
    '## Artifact Manifest 覆盖',
    '',
    ...(manifestCoverage
      ? [
        `- artifact 数量：${manifestCoverage.artifactCount}`,
        `- download manifest：${manifestCoverage.downloadCount}`,
        `- transcribe manifest：${manifestCoverage.transcribeCount}`,
        `- comments manifest：${manifestCoverage.commentsCount}`,
        `- enrich manifest：${manifestCoverage.enrichCount}`,
      ]
      : ['- 未提供 downloadsRoot，未执行 artifact manifest 审计']),
    '',
  ].join('\n');
}

function enumerateLookbackDates(endDate, requiredDays) {
  const dates = [];
  const cursor = new Date(`${endDate}T00:00:00.000Z`);
  for (let index = 0; index < requiredDays; index += 1) {
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
