#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { confirmResearchCandidate } from '../jobs/research-request.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

try {
  const feishuPath = args.feishu ? resolve(cwd, args.feishu) : null;
  const feishuConfig = feishuPath ? await readJsonFile(feishuPath) : null;
  const feishuClient = feishuConfig
    ? feishuConfig.mode === 'lark-cli' ? new LarkCliBitableClient(feishuConfig) : new FeishuBitableClient(feishuConfig)
    : null;
  const result = await confirmResearchCandidate({
    ledgerPath: resolve(cwd, args.ledger ?? 'logs/research-requests.json'),
    requestId: args.requestId,
    candidateIndex: args.candidate ? Number(args.candidate) : undefined,
    action: args.action,
    decisionNote: args.decisionNote,
    verificationEvidence: args.verificationEvidence,
    feishuClient,
    feishuConfig,
  });
  console.log(JSON.stringify({
    ok: true,
    requestId: result.requestId,
    status: result.status,
    feishu: result.feishu,
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
