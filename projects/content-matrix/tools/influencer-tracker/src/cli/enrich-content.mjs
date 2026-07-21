#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { enrichTikHubContent } from '../jobs/enrich-content.mjs';

const args = parseArgs(process.argv.slice(2));

if (!args.input) {
  console.error('[fatal] --input is required');
  process.exit(1);
}

try {
  const result = await enrichTikHubContent({
    inputPath: resolve(process.cwd(), args.input),
    outputPath: resolve(process.cwd(), args.output ?? 'logs/enrichment.json'),
  });

  console.log(JSON.stringify({
    ok: true,
    outputPath: result.outputPath,
    primaryDirection: result.analysis.primaryDirection,
    insightCount: result.analysis.insights.length,
    topicCandidateCount: result.analysis.topicCandidates.length,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
