#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { prepareFeedbackRecord } from '../jobs/prepare-feedback.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  const result = await prepareFeedbackRecord({
    finalDraftPath: args.finalDraft ? resolve(process.cwd(), args.finalDraft) : null,
    account: args.account,
    accountsRoot: resolve(process.cwd(), args.accountsRoot ?? '../../accounts'),
    outputDir: args.outputDir ? resolve(process.cwd(), args.outputDir) : null,
    date: args.date ?? new Date().toISOString().slice(0, 10),
    overwrite: Boolean(args.overwrite),
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
