#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { refineMediaText } from '../jobs/refine-media.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  if (!args.input) {
    throw new Error('--input is required');
  }
  const result = await refineMediaText({
    inputPath: resolve(process.cwd(), args.input),
    outputDir: resolve(process.cwd(), args.outputDir ?? 'logs/media-refinement'),
    sourceLabel: args.sourceLabel ?? null,
  });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
