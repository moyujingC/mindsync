#!/usr/bin/env node
import { resolve } from 'node:path';
import { readJsonFile, writeJsonFile } from '../utils/json-file.mjs';
import { parseArgs } from '../utils/args.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { screenFeishuContents } from '../jobs/screen-content.mjs';

const args = parseArgs(process.argv.slice(2));
let config = null;
try {
  if (!args.feishu) throw new Error('--feishu is required');
  config = await readJsonFile(resolve(process.cwd(), args.feishu));
  const feishuClient = config.mode === 'lark-cli' ? new LarkCliBitableClient(config) : new FeishuBitableClient(config);
  const result = await screenFeishuContents({
    feishuClient,
    feishuConfig: config,
    dryRun: args.dryRun,
    scoredAt: args.scoredAt ?? new Date().toISOString(),
  });
  // Persist a lazily created task table ID in the ignored local config so the
  // independent processing Worker can resolve it on its next run.
  if (!args.dryRun && result.taskQueue?.createdTable) await writeJsonFile(resolve(process.cwd(), args.feishu), config);
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
} finally {
  // A table may be created before a later view update fails. Keep its ID so a
  // retry reuses the table instead of attempting another same-name creation.
  if (!args.dryRun && typeof config?.tables?.contentProcessingTasks?.tableId === 'string') {
    await writeJsonFile(resolve(process.cwd(), args.feishu), config);
  }
}
