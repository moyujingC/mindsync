#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { recordPublicationFeedback } from '../jobs/record-publication-feedback.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  const feishuPath = args.feishu ? resolve(process.cwd(), args.feishu) : null;
  const feishuConfig = feishuPath ? await readJsonFile(feishuPath) : null;
  const feishuClient = feishuConfig
    ? feishuConfig.mode === 'lark-cli' ? new LarkCliBitableClient(feishuConfig) : new FeishuBitableClient(feishuConfig)
    : null;
  const result = await recordPublicationFeedback({
    feedbackPath: args.feedback ? resolve(process.cwd(), args.feedback) : null,
    ledgerPath: resolve(process.cwd(), args.ledger ?? 'logs/research-requests.json'),
    feishuClient,
    feishuConfig,
  });
  console.log(JSON.stringify({ ok: true, requestId: result.requestId, candidateIndex: result.candidateIndex, status: result.request.status, feishu: result.request.feishu }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
