#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { runFeishuActionWorker } from '../jobs/feishu-action-worker.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

if (!args.feishu) {
  console.error('[fatal] --feishu is required');
  process.exit(1);
}

try {
  const result = await runFeishuActionWorker({
    feishuPath: resolve(cwd, args.feishu),
    storePath: resolve(cwd, args.store ?? 'logs/content-store.feishu-worker.json'),
    limit: Number(args.limit ?? 20),
    dryRun: Boolean(args.dryRun),
    cwd,
  });

  console.log(JSON.stringify({
    ok: result.failedCount === 0,
    ...result,
  }, null, 2));
  process.exitCode = result.failedCount > 0 ? 1 : 0;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
