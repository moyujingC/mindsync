#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { buildWeeklyReview } from '../jobs/weekly-review.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  if (!args.historicalSummary) {
    throw new Error('weekly-review is a frozen historical summary. Pass --historical-summary with an explicit --start-date and --end-date; it does not enable Agent Loop.');
  }
  if (!args.startDate || !args.endDate) {
    throw new Error('weekly-review requires explicit --start-date and --end-date');
  }
  const startDate = args.startDate;
  const endDate = args.endDate;
  const runsDir = resolve(process.cwd(), args.runsDir ?? 'logs/runs');
  const topicDir = resolve(process.cwd(), args.topicDir ?? 'logs/topic-candidates');
  const accountsRoot = resolve(process.cwd(), args.accountsRoot ?? '../../accounts');
  const feedbackRoot = resolve(process.cwd(), args.feedbackRoot ?? '../../accounts/墨予镜/feedback');
  const outputPath = resolve(process.cwd(), args.output ?? `logs/weekly-reviews/${endDate}.md`);
  const result = await buildWeeklyReview({
    startDate,
    endDate,
    runsDir,
    topicDir,
    accountsRoot,
    feedbackRoot,
    outputPath,
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
