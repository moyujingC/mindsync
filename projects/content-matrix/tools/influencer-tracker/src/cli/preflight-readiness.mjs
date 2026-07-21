#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { TikHubClient } from '../platforms/tikhub/client.mjs';
import { checkResearchReadiness } from '../jobs/preflight-readiness.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  const cwd = process.cwd();
  const feishuConfig = args.feishu ? await readJsonFile(resolve(cwd, args.feishu)) : null;
  const probe = args.probe
    ? { platform: args.platform, shareUrl: args.shareUrl }
    : null;
  const result = await checkResearchReadiness({
    feishuConfig,
    ledgerPath: resolve(cwd, args.ledger ?? 'logs/research-requests.json'),
    probe,
    tikhubClient: new TikHubClient(),
  });
  console.log(JSON.stringify({ ok: result.ok, ...result }, null, 2));
  if (!result.ok) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
