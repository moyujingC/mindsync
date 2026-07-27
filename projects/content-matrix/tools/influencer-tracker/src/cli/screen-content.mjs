#!/usr/bin/env node
import { resolve } from 'node:path';
import { readJsonFile } from '../utils/json-file.mjs';
import { parseArgs } from '../utils/args.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { screenFeishuContents } from '../jobs/screen-content.mjs';

const args = parseArgs(process.argv.slice(2));
try {
  if (!args.feishu) throw new Error('--feishu is required');
  const config = await readJsonFile(resolve(process.cwd(), args.feishu));
  const feishuClient = config.mode === 'lark-cli' ? new LarkCliBitableClient(config) : new FeishuBitableClient(config);
  const result = await screenFeishuContents({
    feishuClient,
    feishuConfig: config,
    dryRun: args.dryRun,
    scoredAt: args.scoredAt ?? new Date().toISOString(),
  });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
