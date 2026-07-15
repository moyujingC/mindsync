#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { downloadLatestBilibili } from '../jobs/download-bilibili.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  const creators = await readJsonFile(resolve(process.cwd(), args.creators ?? 'fixtures/creators.example.json'));
  const creator = selectCreator(creators, args.creatorId);
  const result = await downloadLatestBilibili({
    creator,
    outputRoot: args.outputRoot ?? 'logs/downloads/bilibili',
    limit: Number(args.limit ?? 1),
    downloadMode: args.downloadMode ?? 'metadata-only',
    cwd: process.cwd(),
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}

function selectCreator(creators, creatorId) {
  const matched = creators.find((item) => item.id === creatorId) ?? creators[0];
  if (!matched) {
    throw new Error('No creator found');
  }
  if (matched.platform !== 'bilibili') {
    throw new Error(`Creator is not bilibili: ${matched.id}`);
  }
  return matched;
}
