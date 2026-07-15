#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { loadCreators } from '../jobs/load-creators.mjs';
import { backfillCreator } from '../jobs/backfill-creator.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();
const creatorsPath = args.creators ? resolve(cwd, args.creators) : null;
const feishuPath = args.feishu ? resolve(cwd, args.feishu) : null;
const storePath = resolve(cwd, args.store ?? 'logs/content-store.backfill.json');

try {
  const loaded = await loadCreators({
    creatorsPath,
    feishuPath,
    cwd,
  });

  const result = await backfillCreator({
    creators: loaded.creators,
    creatorId: args.creatorId,
    creatorName: args.creatorName,
    feishuClient: loaded.feishuClient,
    feishuConfig: loaded.feishuConfig,
    storePath,
    dryRun: Boolean(args.dryRun),
    limit: Number(args.limit ?? 20),
    since: args.since,
    cwd,
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
    contents: result.contents.map((content) => ({
      uniqueKey: content.uniqueKey,
      title: content.title,
      publishedAt: content.publishedAt,
      url: content.url,
    })),
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
