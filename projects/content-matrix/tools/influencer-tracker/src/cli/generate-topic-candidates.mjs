#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { buildTopicCandidatesFromRunReport } from '../analysis/topic-candidates.mjs';

const args = parseArgs(process.argv.slice(2));
const reportPath = args.report ? resolve(process.cwd(), args.report) : null;
const outputDir = resolve(process.cwd(), args.outputDir ?? 'logs/topic-candidates');

try {
  if (!reportPath) {
    throw new Error('Missing --report path');
  }

  const report = await readJsonFile(reportPath);
  const candidates = buildTopicCandidatesFromRunReport(report);
  const outputPath = join(outputDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({
    schema: 'content-matrix/topic-candidates-batch/v1',
    generatedAt: new Date().toISOString(),
    sourceReport: reportPath,
    count: candidates.length,
    candidates,
  }, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    outputPath,
    count: candidates.length,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
