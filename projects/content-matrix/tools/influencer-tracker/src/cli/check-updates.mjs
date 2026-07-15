#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { FeishuBitableClient, mapFeishuCreatorRecord } from '../feishu/client.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';
import { checkUpdates } from '../jobs/check-updates.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

const dryRun = Boolean(args.dryRun);
const creatorsPath = args.creators ? resolve(cwd, args.creators) : null;
const feishuPath = args.feishu ? resolve(cwd, args.feishu) : null;
const storePath = resolve(cwd, args.store ?? 'logs/content-store.local.json');
const platform = args.platform;
const limitPerCreator = Number(args.limit ?? 10);

try {
  const { creators, feishuClient, feishuConfig } = await loadCreators({
    creatorsPath,
    feishuPath,
  });

  const result = await checkUpdates({
    creators,
    feishuClient,
    feishuConfig,
    dryRun,
    storePath,
    platform,
    limitPerCreator,
    cwd,
  });

  printResult(result);
  process.exitCode = result.failedCount > 0 ? 1 : 0;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}

async function loadCreators({ creatorsPath, feishuPath }) {
  if (creatorsPath) {
    return {
      creators: await readJsonFile(creatorsPath),
      feishuClient: null,
      feishuConfig: null,
    };
  }

  if (!feishuPath) {
    throw new Error('Missing --creators or --feishu. Use --dry-run --creators fixtures/creators.example.json for local verification.');
  }

  const feishuConfig = await readJsonFile(feishuPath);
  const configValidation = validateFeishuConfig(feishuConfig);
  if (!configValidation.ok) {
    throw new Error(`Invalid Feishu config: ${configValidation.errors.join('; ')}`);
  }

  const feishuClient = new FeishuBitableClient(feishuConfig);
  const records = await feishuClient.listRecords('creators');
  const creatorsFieldMap = feishuConfig.tables.creators.fields;
  return {
    creators: records.map((record) => mapFeishuCreatorRecord(record, creatorsFieldMap)),
    feishuClient,
    feishuConfig,
  };
}

function printResult(result) {
  console.log(JSON.stringify({
    dryRun: result.dryRun,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    creatorCount: result.creatorCount,
    createdCount: result.createdCount,
    duplicateCount: result.duplicateCount,
    failedCount: result.failedCount,
    creators: result.creatorResults.map((creator) => ({
      name: creator.creatorName,
      platform: creator.platform,
      fetchedCount: creator.fetchedCount,
      createdCount: creator.createdCount,
      duplicateCount: creator.duplicateCount,
      failed: creator.failed,
      error: creator.error,
      newContents: (creator.contents ?? []).map((content) => ({
        uniqueKey: content.uniqueKey,
        title: content.title,
        url: content.url,
        publishedAt: content.publishedAt,
      })),
    })),
  }, null, 2));
}
