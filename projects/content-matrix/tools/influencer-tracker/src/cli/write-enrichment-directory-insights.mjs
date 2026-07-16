#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { writeEnrichmentDirectoryInsightsToFeishu } from '../jobs/write-enrichment-insights.mjs';

const args = parseArgs(process.argv.slice(2));

if (!args.rootDir) {
  console.error('[fatal] --root-dir is required');
  process.exit(1);
}

try {
  const result = await writeEnrichmentDirectoryInsightsToFeishu({
    rootDir: resolve(process.cwd(), args.rootDir),
    feishuPath: args.feishu ? resolve(process.cwd(), args.feishu) : null,
    reportPath: args.report ? resolve(process.cwd(), args.report) : null,
    markdownReportPath: args.markdownReport ? resolve(process.cwd(), args.markdownReport) : null,
    markProcessed: Boolean(args.markProcessed),
    date: args.date ?? null,
    creator: args.creator ?? null,
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
