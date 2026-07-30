#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile, writeJsonFile } from '../utils/json-file.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { ensureContentExperimentTable, recordContentExperiment } from '../jobs/content-experiment.mjs';

const args = parseArgs(process.argv.slice(2));
try {
  if (!args.feishu) throw new Error('--feishu is required');
  const configPath = resolve(process.cwd(), args.feishu);
  const config = await readJsonFile(configPath);
  const client = config.mode === 'lark-cli' ? new LarkCliBitableClient(config) : new FeishuBitableClient(config);
  const result = args.input
    ? await recordContentExperiment({ feishuClient: client, feishuConfig: config, experiment: await readJsonFile(resolve(process.cwd(), args.input)), dryRun: args.dryRun })
    : await ensureContentExperimentTable({ feishuClient: client, feishuConfig: config, dryRun: args.dryRun });
  if (!args.dryRun) await writeJsonFile(configPath, config);
  console.log(JSON.stringify({ ok: true, dryRun: Boolean(args.dryRun), ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
