import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export function buildRunReport(result, meta = {}) {
  return {
    schema: 'content-matrix/influencer-tracker-run/v1',
    generatedAt: new Date().toISOString(),
    meta,
    summary: {
      dryRun: result.dryRun,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      creatorCount: result.creatorCount,
      createdCount: result.createdCount,
      duplicateCount: result.duplicateCount,
      failedCount: result.failedCount,
    },
    creators: result.creatorResults.map((creator) => ({
      creatorId: creator.creatorId,
      creatorName: creator.creatorName,
      platform: creator.platform,
      fetchedCount: creator.fetchedCount,
      createdCount: creator.createdCount,
      duplicateCount: creator.duplicateCount,
      failed: creator.failed,
      error: creator.error,
      newContents: (creator.contents ?? []).map((content) => ({
        uniqueKey: content.uniqueKey,
        title: content.title,
        url: content.url,
        publishedAt: content.publishedAt,
      })),
    })),
  };
}

export async function writeRunReport({ result, reportDir, meta }) {
  const report = buildRunReport(result, meta);
  const date = report.generatedAt.slice(0, 10);
  const timestamp = report.generatedAt.replace(/[:.]/g, '-');
  const filePath = join(reportDir, date, `${timestamp}.json`);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return {
    filePath,
    report,
  };
}
