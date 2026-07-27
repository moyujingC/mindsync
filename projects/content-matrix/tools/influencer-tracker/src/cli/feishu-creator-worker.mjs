#!/usr/bin/env node
import { resolve } from 'node:path';
import { runFeishuCreatorWorker } from '../jobs/feishu-creator-worker.mjs';
import { screenFeishuContents } from '../jobs/screen-content.mjs';
import { readJsonFile, writeJsonFile } from '../utils/json-file.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
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
  const configPath = resolve(cwd, args.feishu);
  const config = await readJsonFile(configPath);
  const client = config.mode === 'lark-cli' ? new LarkCliBitableClient(config) : new FeishuBitableClient(config);
  const screening = result.successCount > 0
    ? await screenFeishuContents({ feishuClient: client, feishuConfig: config, dryRun: Boolean(args.dryRun) })
    : null;
  if (!args.dryRun && screening?.taskQueue?.createdTable) await writeJsonFile(configPath, config);
  console.log(JSON.stringify({ ok: result.failedCount === 0, ...result, screening }, null, 2));
  process.exitCode = result.failedCount > 0 ? 1 : 0;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
