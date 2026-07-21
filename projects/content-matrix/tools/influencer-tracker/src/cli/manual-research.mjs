#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { runManualResearchRequest } from '../jobs/manual-research.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

try {
  if (!args.input) {
    throw new Error('Missing --input path');
  }
  const inputPath = resolve(cwd, args.input);
  const input = await readJsonFile(inputPath);
  const feishuPath = args.feishu ? resolve(cwd, args.feishu) : null;
  const feishuConfig = feishuPath ? await readJsonFile(feishuPath) : null;
  const feishuClient = feishuConfig
    ? feishuConfig.mode === 'lark-cli' ? new LarkCliBitableClient(feishuConfig) : new FeishuBitableClient(feishuConfig)
    : null;
  const result = await runManualResearchRequest({
    request: {
      requestId: args.requestId ?? input.request?.requestId,
      templateId: args.template ?? input.request?.templateId,
      projectName: args.projectName ?? input.request?.projectName,
      purpose: args.purpose ?? input.request?.purpose,
      serviceDirection: args.serviceDirection ?? input.request?.serviceDirection,
      targetAccount: args.targetAccount ?? input.request?.targetAccount,
      collect: {
        mode: 'manual',
        platform: args.platform ?? input.request?.platform ?? input.items?.[0]?.platform,
        includeComments: args.includeComments || Boolean(input.request?.includeComments),
        limit: args.limit ? Number(args.limit) : input.request?.limit,
      },
    },
    items: input.items,
    inputPath,
    storePath: resolve(cwd, args.store ?? 'logs/content-store.manual-research.json'),
    ledgerPath: resolve(cwd, args.ledger ?? 'logs/research-requests.json'),
    outputDir: resolve(cwd, args.outputDir ?? 'logs/research-briefs'),
    feishuClient,
    feishuConfig,
    dryRun: Boolean(args.dryRun),
  });
  console.log(JSON.stringify({ ok: true, dryRun: Boolean(args.dryRun), ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
