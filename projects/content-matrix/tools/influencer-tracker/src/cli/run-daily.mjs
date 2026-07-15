#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { loadCreators } from '../jobs/load-creators.mjs';
import { checkUpdates } from '../jobs/check-updates.mjs';
import { writeRunReport } from '../utils/report.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

const dryRun = Boolean(args.dryRun);
const creatorsPath = args.creators ?? null;
const feishuPath = args.feishu ?? null;
const storePath = resolve(cwd, args.store ?? 'logs/content-store.local.json');
const reportDir = resolve(cwd, args.reportDir ?? 'logs/runs');
const platform = args.platform;
const limitPerCreator = Number(args.limit ?? 10);

try {
  const loaded = await loadCreators({
    creatorsPath,
    feishuPath,
    cwd,
  });

  const result = await checkUpdates({
    creators: loaded.creators,
    feishuClient: loaded.feishuClient,
    feishuConfig: loaded.feishuConfig,
    dryRun,
    storePath,
    platform,
    limitPerCreator,
    cwd,
  });

  const { filePath } = await writeRunReport({
    result,
    reportDir,
    meta: {
      mode: 'daily',
      source: loaded.source,
      platform: platform ?? 'all',
      limitPerCreator,
    },
  });

  console.log(JSON.stringify({
    ok: result.failedCount === 0,
    reportPath: filePath,
    summary: {
      creatorCount: result.creatorCount,
      createdCount: result.createdCount,
      duplicateCount: result.duplicateCount,
      failedCount: result.failedCount,
      dryRun,
    },
  }, null, 2));

  process.exitCode = result.failedCount > 0 ? 1 : 0;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
