#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { buildTopicCandidatesFromRunReport, writeTopicCandidatesReport } from '../analysis/topic-candidates.mjs';
import { writeTopicCandidatesToFeishu } from '../jobs/write-topic-candidates.mjs';

const args = parseArgs(process.argv.slice(2));
const reportPath = args.report ? resolve(process.cwd(), args.report) : null;
const outputDir = resolve(process.cwd(), args.outputDir ?? 'logs/topic-candidates');
const feishuPath = args.feishu ? resolve(process.cwd(), args.feishu) : null;

try {
  if (!reportPath) {
    throw new Error('Missing --report path');
  }

  const report = await readJsonFile(reportPath);
  const candidates = buildTopicCandidatesFromRunReport(report);
  const writeResult = await writeTopicCandidatesToFeishu({
    candidates,
    feishuPath,
  });
  const { outputPath } = await writeTopicCandidatesReport({
    report: reportPath,
    candidates,
    outputDir,
    feishu: writeResult,
  });

  console.log(JSON.stringify({
    ok: true,
    outputPath,
    count: candidates.length,
    feishu: writeResult,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
