#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { evaluateAgentLoopReadiness } from '../jobs/evaluate-agent-loop-readiness.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  const result = await evaluateAgentLoopReadiness({
    ledgerPath: resolve(process.cwd(), args.ledger ?? 'logs/research-requests.json'),
  });
  console.log(JSON.stringify({ ok: result.ok, ...result }, null, 2));
  if (!result.ok) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
