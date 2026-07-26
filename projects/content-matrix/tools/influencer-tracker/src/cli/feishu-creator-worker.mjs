#!/usr/bin/env node
import { resolve } from 'node:path';
import { runFeishuCreatorWorker } from '../jobs/feishu-creator-worker.mjs';
import { parseArgs } from '../utils/args.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

try {
  if (!args.feishu) throw new Error('--feishu is required');
  const result = await runFeishuCreatorWorker({
    feishuPath: resolve(cwd, args.feishu),
    storePath: resolve(cwd, args.store ?? 'logs/content-store.feishu-creator-worker.json'),
    limit: Number(args.limit ?? 10),
    backfillDays: Number(args.backfillDays ?? 90),
    backfillLimit: Number(args.backfillLimit ?? 100),
    dryRun: Boolean(args.dryRun),
    cwd,
  });
  console.log(JSON.stringify({ ok: result.failedCount === 0, ...result }, null, 2));
  process.exitCode = result.failedCount > 0 ? 1 : 0;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
