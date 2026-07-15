#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';
import { syncBilibiliComments } from '../jobs/sync-bilibili-comments.mjs';

const args = parseArgs(process.argv.slice(2));

if (!args.input) {
  console.error('[fatal] --input is required');
  process.exit(1);
}

try {
  const { feishuClient, feishuConfig } = args.feishu
    ? await loadFeishu(resolve(process.cwd(), args.feishu))
    : { feishuClient: null, feishuConfig: null };

  const result = await syncBilibiliComments({
    inputPath: args.input,
    artifactDir: args.artifactDir ?? null,
    feishuClient,
    feishuConfig,
    dryRun: Boolean(args.dryRun || !args.feishu),
    cwd: process.cwd(),
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}

async function loadFeishu(feishuPath) {
  const feishuConfig = await readJsonFile(feishuPath);
  const configValidation = validateFeishuConfig(feishuConfig);
  if (!configValidation.ok) {
    throw new Error(`Invalid Feishu config: ${configValidation.errors.join('; ')}`);
  }
  const feishuClient = feishuConfig.mode === 'lark-cli'
    ? new LarkCliBitableClient(feishuConfig)
    : new FeishuBitableClient(feishuConfig);
  return { feishuClient, feishuConfig };
}
