#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { prepareEditPackage } from '../jobs/prepare-edit.mjs';

const args = parseArgs(process.argv.slice(2));
const draftPath = args.draft ? resolve(process.cwd(), args.draft) : null;
const outputDir = resolve(process.cwd(), args.outputDir ?? 'logs/edit-packages');
const skillPath = args.skillPath ?? undefined;

try {
  const result = await prepareEditPackage({
    draftPath,
    account: args.account,
    outputDir,
    skillPath,
    date: args.date,
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
