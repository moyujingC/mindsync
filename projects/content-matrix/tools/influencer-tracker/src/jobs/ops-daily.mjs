import { resolve } from 'node:path';
import { checkUpdates } from './check-updates.mjs';
import { loadCreators } from './load-creators.mjs';
import { writeRunReport } from '../utils/report.mjs';
import { buildTopicCandidatesFromRunReport, writeTopicCandidatesReport } from '../analysis/topic-candidates.mjs';
import { writeTopicCandidatesToFeishu } from './write-topic-candidates.mjs';
import { buildDailySummary } from './daily-summary.mjs';
import { buildFailureReview } from './failure-review.mjs';

export async function runOpsDaily({
  dryRun = false,
  creatorsPath = null,
  feishuPath = null,
  storePath,
  reportDir,
  topicDir,
  accountsRoot,
  dailySummaryOutput,
  failureReviewOutput,
  platform,
  limitPerCreator = 10,
  lookbackDays = 7,
  failureThreshold = 3,
  pauseSource = false,
  cwd = process.cwd(),
}) {
  const loaded = await loadCreators({
    creatorsPath,
    feishuPath,
    cwd,
  });

  const result = await checkUpdates({
    creators: loaded.creators,
    feishuClient: loaded.feishuClient,
    feishuConfig: loaded.feishuConfig,
    dryRun,
    storePath,
    platform,
    limitPerCreator,
    cwd,
  });

  const { filePath: reportPath, report } = await writeRunReport({
    result,
    reportDir,
    meta: {
      mode: 'ops-daily',
      source: loaded.source,
      platform: platform ?? 'all',
      limitPerCreator,
    },
  });

  const topicCandidates = buildTopicCandidatesFromRunReport(report);
  const topicReport = await writeTopicCandidatesReport({
    report,
    candidates: topicCandidates,
    outputDir: topicDir,
  });

  let topicWriteResult = null;
  if (!dryRun && loaded.feishuClient && loaded.feishuConfig) {
    topicWriteResult = await writeTopicCandidatesToFeishu({
      feishuClient: loaded.feishuClient,
      feishuConfig: loaded.feishuConfig,
      candidates: topicCandidates,
    });
  }

  const date = report.generatedAt.slice(0, 10);
  const dailySummary = await buildDailySummary({
    date,
    runsDir: reportDir,
    topicDir,
    accountsRoot,
    outputPath: dailySummaryOutput,
  });

  const failureReview = await buildFailureReview({
    date,
    lookbackDays,
    threshold: failureThreshold,
    runsDir: reportDir,
    outputPath: failureReviewOutput,
    feishuClient: loaded.feishuClient,
    feishuConfig: loaded.feishuConfig,
    markStatus: !dryRun,
    pauseSource: !dryRun && pauseSource,
  });

  return {
    date,
    dryRun,
    reportPath,
    reportSummary: report.summary,
    topicReportPath: topicReport.outputPath,
    topicSummary: {
      candidateCount: topicCandidates.length,
      createdCount: topicWriteResult?.createdCount ?? 0,
      duplicateCount: topicWriteResult?.duplicateCount ?? 0,
    },
    dailySummaryPath: dailySummary.outputPath,
    failureReviewPath: failureReview.outputPath,
    failureSummary: failureReview.summary,
  };
}
