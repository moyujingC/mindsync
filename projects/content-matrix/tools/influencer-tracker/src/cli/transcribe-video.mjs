#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { transcribeVideoArtifact } from '../jobs/transcribe-video.mjs';

const args = parseArgs(process.argv.slice(2));

if (!args.artifactDir) {
  console.error('[fatal] --artifact-dir is required');
  process.exit(1);
}

try {
  const result = await transcribeVideoArtifact({
    artifactDir: resolve(process.cwd(), args.artifactDir),
    mode: args.mode ?? 'auto',
    language: args.language ?? 'zh',
    whisperModel: args.whisperModel ?? 'turbo',
  });

  console.log(JSON.stringify({
    ok: result.transcriptStatus !== 'failed',
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
