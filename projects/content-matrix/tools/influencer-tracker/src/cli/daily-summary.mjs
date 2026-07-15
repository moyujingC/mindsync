#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { buildDailySummary } from '../jobs/daily-summary.mjs';

const args = parseArgs(process.argv.slice(2));
const date = args.date ?? new Date().toISOString().slice(0, 10);
const runsDir = resolve(process.cwd(), args.runsDir ?? 'logs/runs');
const topicDir = resolve(process.cwd(), args.topicDir ?? 'logs/topic-candidates');
const accountsRoot = resolve(process.cwd(), args.accountsRoot ?? '../../accounts');
const outputPath = resolve(process.cwd(), args.output ?? `logs/daily-summaries/${date}.md`);

try {
  const result = await buildDailySummary({
    date,
    runsDir,
    topicDir,
    accountsRoot,
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
