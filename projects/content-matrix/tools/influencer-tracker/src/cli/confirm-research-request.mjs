#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { confirmResearchCandidate } from '../jobs/research-request.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  const result = await confirmResearchCandidate({
    ledgerPath: resolve(process.cwd(), args.ledger ?? 'logs/research-requests.json'),
    requestId: args.requestId,
    candidateIndex: args.candidate ? Number(args.candidate) : undefined,
    action: args.action,
    decisionNote: args.decisionNote,
    verificationEvidence: args.verificationEvidence,
  });
  console.log(JSON.stringify({
    ok: true,
    requestId: result.requestId,
    status: result.status,
    candidates: result.candidates.map((candidate, index) => ({
      index: index + 1,
      topicTitle: candidate.topicTitle,
      status: candidate.status,
      evidenceLevel: candidate.evidenceLevel,
      conclusionLevel: candidate.conclusionLevel,
    })),
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
