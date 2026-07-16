#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { enrichContentArtifact } from '../jobs/enrich-content.mjs';

const args = parseArgs(process.argv.slice(2));

if (!args.artifactDir) {
  console.error('[fatal] --artifact-dir is required');
  process.exit(1);
}

try {
  const result = await enrichContentArtifact({
    artifactDir: resolve(process.cwd(), args.artifactDir),
    commentsPath: args.comments ? resolve(process.cwd(), args.comments) : null,
  });

  console.log(JSON.stringify({
    ok: true,
    outputPath: result.outputPath,
    manifestPath: result.manifestPath,
    primaryDirection: result.analysis.primaryDirection,
    insightCount: result.analysis.insights.length,
    topicCandidateCount: result.analysis.topicCandidates.length,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
