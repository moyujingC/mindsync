#!/usr/bin/env node
import { resolve } from 'node:path';
import { readJsonFile } from '../utils/json-file.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { processNextContentTask } from '../jobs/content-processing-worker.mjs';
import { parseArgs } from '../utils/args.mjs';

const args = parseArgs(process.argv.slice(2));
try {
  const cwd = process.cwd();
  const config = await readJsonFile(resolve(cwd, args.feishu ?? 'config/feishu.local.json'));
  const client = config.mode === 'lark-cli' ? new LarkCliBitableClient(config) : new FeishuBitableClient(config);
  const result = await processNextContentTask({ feishuClient: client, feishuConfig: config, appDir: cwd, storePath: resolve(cwd, 'logs/content-store.tikhub.json'), outputDir: resolve(cwd, 'logs/media-evidence') });
  console.log(JSON.stringify({ ok: result.ok ?? true, ...result }, null, 2));
} catch (error) { console.error(`[fatal] ${error.message}`); process.exitCode = 1; }
