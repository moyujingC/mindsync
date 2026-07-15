#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { buildWeeklyReview } from '../jobs/weekly-review.mjs';

const args = parseArgs(process.argv.slice(2));
const endDate = args.endDate ?? new Date().toISOString().slice(0, 10);
const startDate = args.startDate ?? shiftDate(endDate, -6);
const runsDir = resolve(process.cwd(), args.runsDir ?? 'logs/runs');
const topicDir = resolve(process.cwd(), args.topicDir ?? 'logs/topic-candidates');
const accountsRoot = resolve(process.cwd(), args.accountsRoot ?? '../../accounts');
const feedbackRoot = resolve(process.cwd(), args.feedbackRoot ?? '../../accounts/墨予镜/feedback');
const outputPath = resolve(process.cwd(), args.output ?? `logs/weekly-reviews/${endDate}.md`);

try {
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

function shiftDate(date, offsetDays) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value.toISOString().slice(0, 10);
}
