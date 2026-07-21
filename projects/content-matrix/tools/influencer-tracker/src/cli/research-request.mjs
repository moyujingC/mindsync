#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { TikHubClient } from '../platforms/tikhub/client.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { collectTikHubResearch } from '../jobs/tikhub-collect.mjs';
import { runResearchRequest } from '../jobs/research-request.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

try {
  const feishuPath = args.feishu ? resolve(cwd, args.feishu) : null;
  const feishuConfig = feishuPath ? await readJsonFile(feishuPath) : null;
  const feishuClient = feishuConfig
    ? feishuConfig.mode === 'lark-cli' ? new LarkCliBitableClient(feishuConfig) : new FeishuBitableClient(feishuConfig)
    : null;
  const result = await runResearchRequest({
    request: {
      purpose: args.purpose,
      serviceDirection: args.serviceDirection,
      targetAccount: args.targetAccount,
      collect: {
        mode: args.mode,
        platform: args.platform,
        shareUrl: args.shareUrl,
        keyword: args.keyword,
        creatorId: args.creatorId,
        includeComments: Boolean(args.includeComments),
        limit: args.limit ? Number(args.limit) : undefined,
      },
    },
    collect: (collectRequest) => collectTikHubResearch({
      request: collectRequest,
      client: new TikHubClient(),
      feishuClient,
      feishuConfig,
      storePath: resolve(cwd, args.store ?? 'logs/content-store.tikhub.json'),
      dryRun: Boolean(args.dryRun),
    }),
    outputDir: resolve(cwd, args.outputDir ?? 'logs/research-briefs'),
  });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
