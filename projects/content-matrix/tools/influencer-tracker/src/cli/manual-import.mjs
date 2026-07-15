#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { importManualContents } from '../jobs/manual-import.mjs';

const args = parseArgs(process.argv.slice(2));
const inputPath = args.input ? resolve(process.cwd(), args.input) : null;
const storePath = resolve(process.cwd(), args.store ?? 'logs/content-store.manual.json');
const feishuPath = args.feishu ? resolve(process.cwd(), args.feishu) : null;

try {
  if (!inputPath) {
    throw new Error('Missing --input path');
  }

  const result = await importManualContents({
    inputPath,
    storePath,
    feishuPath,
    dryRun: Boolean(args.dryRun),
  });

  console.log(JSON.stringify({
    ok: true,
    inputCount: result.inputCount,
    createdCount: result.createdCount,
    duplicateCount: result.duplicateCount,
    dryRun: result.dryRun,
    recordIds: result.recordIds,
    contents: result.contents.map((content) => ({
      uniqueKey: content.uniqueKey,
      platform: content.platform,
      title: content.title,
      url: content.url,
    })),
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
