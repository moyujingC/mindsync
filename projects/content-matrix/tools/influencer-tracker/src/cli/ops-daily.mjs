#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { runOpsDaily } from '../jobs/ops-daily.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();
const dryRun = Boolean(args.dryRun);
const date = args.date ?? new Date().toISOString().slice(0, 10);

try {
  const result = await runOpsDaily({
    dryRun,
    creatorsPath: args.creators ?? null,
    feishuPath: args.feishu ?? null,
    storePath: resolve(cwd, args.store ?? 'logs/content-store.local.json'),
    reportDir: resolve(cwd, args.reportDir ?? 'logs/runs'),
    topicDir: resolve(cwd, args.topicDir ?? 'logs/topic-candidates'),
    accountsRoot: resolve(cwd, args.accountsRoot ?? '../../accounts'),
    dailySummaryOutput: resolve(cwd, args.dailySummaryOutput ?? `logs/daily-summaries/${date}.md`),
    failureReviewOutput: resolve(cwd, args.failureReviewOutput ?? `logs/failure-reviews/${date}.md`),
    platform: args.platform,
    limitPerCreator: Number(args.limit ?? 10),
    lookbackDays: Number(args.lookbackDays ?? 7),
    failureThreshold: Number(args.failureThreshold ?? 3),
    pauseSource: Boolean(args.pauseSource),
    cwd,
  });

  console.log(JSON.stringify({
    ok: result.reportSummary.failedCount === 0,
    ...result,
  }, null, 2));

  process.exitCode = result.reportSummary.failedCount > 0 ? 1 : 0;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
