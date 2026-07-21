#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { handoffResearchCandidate } from '../jobs/handoff-research-candidate.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  const result = await handoffResearchCandidate({
    ledgerPath: resolve(process.cwd(), args.ledger ?? 'logs/research-requests.json'),
    requestId: args.requestId,
    candidateIndex: args.candidate ? Number(args.candidate) : undefined,
    outputDir: resolve(process.cwd(), args.outputDir ?? 'logs/research-handoffs'),
  });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
