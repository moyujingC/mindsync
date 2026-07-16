#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { writeEnrichmentInsightsToFeishu } from '../jobs/write-enrichment-insights.mjs';

const args = parseArgs(process.argv.slice(2));

if (!args.enrichment) {
  console.error('[fatal] --enrichment is required');
  process.exit(1);
}

try {
  const result = await writeEnrichmentInsightsToFeishu({
    enrichmentPath: resolve(process.cwd(), args.enrichment),
    feishuPath: args.feishu ? resolve(process.cwd(), args.feishu) : null,
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
