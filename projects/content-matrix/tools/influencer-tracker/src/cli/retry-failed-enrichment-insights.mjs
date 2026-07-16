#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { writeFailedEnrichmentInsightsToFeishu } from '../jobs/write-enrichment-insights.mjs';

const args = parseArgs(process.argv.slice(2));

if (!args.report) {
  console.error('[fatal] --report is required');
  process.exit(1);
}

try {
  const result = await writeFailedEnrichmentInsightsToFeishu({
    reportPath: resolve(process.cwd(), args.report),
    feishuPath: args.feishu ? resolve(process.cwd(), args.feishu) : null,
    retryReportPath: args.retryReport ? resolve(process.cwd(), args.retryReport) : null,
    markProcessed: Boolean(args.markProcessed),
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
