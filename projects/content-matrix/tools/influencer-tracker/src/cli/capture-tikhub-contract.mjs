#!/usr/bin/env node
import { resolve } from 'node:path';
import { captureTikHubContract } from '../jobs/capture-tikhub-contract.mjs';
import { TikHubClient } from '../platforms/tikhub/client.mjs';
import { parseArgs } from '../utils/args.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  if (!args.mode || !args.platform) {
    throw new Error('--mode and --platform are required');
  }
  const request = {
    mode: args.mode,
    platform: args.platform,
    shareUrl: args.shareUrl ?? null,
    contentId: args.contentId ?? null,
    keyword: args.keyword ?? null,
    creatorId: args.creatorId ?? null,
    includeComments: Boolean(args.includeComments),
    limit: args.limit ? Number(args.limit) : 1,
    maxPages: args.maxPages ? Number(args.maxPages) : 1,
    commentLimit: args.commentLimit ? Number(args.commentLimit) : 1,
    commentPages: args.commentPages ? Number(args.commentPages) : 1,
  };
  const result = await captureTikHubContract({
    request,
    client: new TikHubClient(),
    outputDir: resolve(process.cwd(), args.outputDir ?? 'fixtures/tikhub-contracts/real'),
  });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
