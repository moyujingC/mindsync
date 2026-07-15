#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { promoteDraftSeed } from '../jobs/promote-draft.mjs';

const args = parseArgs(process.argv.slice(2));
const draftPath = args.draft ? resolve(process.cwd(), args.draft) : null;
const accountsRoot = resolve(process.cwd(), args.accountsRoot ?? '../../accounts');

try {
  const result = await promoteDraftSeed({
    draftPath,
    account: args.account,
    accountsRoot,
    date: args.date,
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
