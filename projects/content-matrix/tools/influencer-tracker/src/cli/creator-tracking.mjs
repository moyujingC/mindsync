#!/usr/bin/env node
import { resolve } from 'node:path';
import { confirmCreatorTracking, createCreatorTrackingFeishuClient, prepareCreatorTracking } from '../jobs/creator-tracking.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { parseArgs } from '../utils/args.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();
try {
  if (!args.feishu) throw new Error('--feishu is required');
  const config = await readJsonFile(resolve(cwd, args.feishu));
  const common = { feishuClient: createCreatorTrackingFeishuClient(config), feishuConfig: config, pendingStorePath: resolve(cwd, args.pendingStore ?? 'logs/creator-tracking-pending.json') };
  const result = args.confirm
    ? await confirmCreatorTracking({ ...common, confirmationId: args.confirm })
    : await prepareCreatorTracking({ ...common, sourceUrl: args.url, topics: args.topics, frequency: args.frequency ?? '手动' });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
