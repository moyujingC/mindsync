#!/usr/bin/env node
import { parseArgs } from '../utils/args.mjs';
import { diagnoseBilibiliSource } from '../jobs/diagnose-bilibili-source.mjs';

const args = parseArgs(process.argv.slice(2));
const uid = args.uid ?? args.mid;
const rsshubBaseUrls = args.rsshubBaseUrls
  ? String(args.rsshubBaseUrls).split(',').map((value) => value.trim()).filter(Boolean)
  : [];

try {
  const result = await diagnoseBilibiliSource({
    uid,
    creatorName: args.name ?? 'B站诊断账号',
    rsshubBaseUrls,
    timeoutMs: Number(args.timeoutMs ?? 10000),
  });

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
