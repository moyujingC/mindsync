#!/usr/bin/env node
import { resolve } from 'node:path';
import { createFeishuClient, processNextLinkInbox, retryLinkInbox } from '../inbox/link-inbox-worker.mjs';
import { createFeishuGroupNotifier } from '../notifications/feishu-group.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { parseArgs } from '../utils/args.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

try {
  const feishuConfig = args.feishu ? await readJsonFile(resolve(cwd, args.feishu)) : null;
  const notify = createFeishuGroupNotifier();
  const common = {
    storePath: resolve(cwd, args.store ?? 'logs/link-inbox.json'),
    feishuClient: createFeishuClient(feishuConfig),
    feishuConfig,
    notify,
  };
  const result = args.retry
    ? await retryLinkInbox({ ...common, inboxId: args.retry })
    : await processNextLinkInbox({
      ...common,
      outputDir: resolve(cwd, args.outputDir ?? 'logs/research-briefs'),
      ledgerPath: resolve(cwd, args.ledger ?? 'logs/research-requests.json'),
      contentStorePath: resolve(cwd, args.contentStore ?? 'logs/content-store.tikhub.json'),
    });
  console.log(JSON.stringify({ ok: result.ok ?? true, ...result }, null, 2));
  process.exitCode = result.ok === false ? 1 : 0;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
