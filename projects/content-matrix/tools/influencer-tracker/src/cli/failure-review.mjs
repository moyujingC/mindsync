#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { buildFailureReview } from '../jobs/failure-review.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';

const args = parseArgs(process.argv.slice(2));
const date = args.date ?? new Date().toISOString().slice(0, 10);
const runsDir = resolve(process.cwd(), args.runsDir ?? 'logs/runs');
const outputPath = resolve(process.cwd(), args.output ?? `logs/failure-reviews/${date}.md`);
const lookbackDays = Number(args.lookbackDays ?? 7);
const threshold = Number(args.threshold ?? 3);
const markStatus = Boolean(args.markStatus);

try {
  let feishuClient = null;
  let feishuConfig = null;

  if (args.feishu) {
    feishuConfig = await readJsonFile(resolve(process.cwd(), args.feishu));
    const validation = validateFeishuConfig(feishuConfig);
    if (!validation.ok) {
      throw new Error(`Invalid Feishu config: ${validation.errors.join('; ')}`);
    }
    feishuClient = feishuConfig.mode === 'lark-cli'
      ? new LarkCliBitableClient(feishuConfig)
      : new FeishuBitableClient(feishuConfig);
  }

  const result = await buildFailureReview({
    date,
    lookbackDays,
    threshold,
    runsDir,
    outputPath,
    feishuClient,
    feishuConfig,
    markStatus,
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
