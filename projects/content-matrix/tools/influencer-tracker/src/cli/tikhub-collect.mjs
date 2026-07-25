#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { TikHubClient } from '../platforms/tikhub/client.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { collectTikHubResearch } from '../jobs/tikhub-collect.mjs';
import { resolveDetailContentLink } from '../platforms/content-link.mjs';
import { normalizePlatformId } from '../platforms/platform-id.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

try {
  const request = await buildRequest(args);
  const feishuPath = args.feishu ? resolve(cwd, args.feishu) : null;
  const feishuConfig = feishuPath ? await readJsonFile(feishuPath) : null;
  const feishuClient = feishuConfig
    ? feishuConfig.mode === 'lark-cli' ? new LarkCliBitableClient(feishuConfig) : new FeishuBitableClient(feishuConfig)
    : null;
  const result = await collectTikHubResearch({
    request,
    client: new TikHubClient(),
    feishuClient,
    feishuConfig,
    storePath: resolve(cwd, args.store ?? 'logs/content-store.tikhub.json'),
    dryRun: Boolean(args.dryRun),
  });
  console.log(JSON.stringify({ ok: true, dryRun: Boolean(args.dryRun), ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}

async function buildRequest(args) {
  const request = {
    mode: args.mode,
    platform: args.platform,
    shareUrl: args.shareUrl,
    contentId: args.contentId,
    keyword: args.keyword,
    creatorId: args.creatorId,
    creatorRecordId: args.creatorRecordId,
    creatorSourceLink: args.creatorSourceLink,
    creatorHomepageUrl: args.creatorHomepageUrl,
    creatorName: args.creatorName,
    includeComments: Boolean(args.includeComments),
    limit: args.limit ? Number(args.limit) : undefined,
    maxPages: args.maxPages ? Number(args.maxPages) : undefined,
    commentLimit: args.commentLimit ? Number(args.commentLimit) : undefined,
    commentPages: args.commentPages ? Number(args.commentPages) : undefined,
  };
  if (request.mode === 'detail' && request.shareUrl) {
    const resolved = await resolveDetailContentLink({ url: request.shareUrl });
    if (request.platform) {
      const providedPlatform = normalizePlatformId(request.platform, 'provided platform');
      if (providedPlatform !== resolved.platform) {
        throw new Error(`Provided platform ${providedPlatform} does not match resolved link platform ${resolved.platform}`);
      }
    }
    request.platform = resolved.platform;
    request.shareUrl = resolved.finalUrl;
    request.contentId ??= resolved.contentId;
  }
  return request;
}
