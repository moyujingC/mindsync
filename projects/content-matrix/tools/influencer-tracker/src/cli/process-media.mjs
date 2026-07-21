#!/usr/bin/env node
import { resolve } from 'node:path';
import { processLocalMedia } from '../jobs/process-media.mjs';
import { parseArgs } from '../utils/args.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  if (!args.input) {
    throw new Error('--input is required');
  }
  const result = await processLocalMedia({
    inputPath: resolve(process.cwd(), args.input),
    outputDir: resolve(process.cwd(), args.outputDir ?? 'logs/media-transcription'),
    sourceLabel: args.sourceLabel ?? null,
    model: args.model ?? 'base',
    language: args.language ?? 'zh',
  });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
