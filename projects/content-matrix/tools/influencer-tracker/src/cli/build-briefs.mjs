#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { buildBriefsFromFeishu } from '../jobs/build-briefs.mjs';

const args = parseArgs(process.argv.slice(2));
const feishuPath = args.feishu ? resolve(process.cwd(), args.feishu) : null;
const outputDir = resolve(process.cwd(), args.outputDir ?? 'logs/briefs');

try {
  if (!feishuPath) {
    throw new Error('Missing --feishu config path');
  }

  const result = await buildBriefsFromFeishu({
    feishuPath,
    outputDir,
    all: args.all,
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
