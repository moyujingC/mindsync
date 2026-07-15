#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { buildOpsAudit } from '../jobs/ops-audit.mjs';

const args = parseArgs(process.argv.slice(2));
const endDate = args.endDate ?? new Date().toISOString().slice(0, 10);

try {
  const result = await buildOpsAudit({
    endDate,
    requiredDays: Number(args.requiredDays ?? 7),
    runsDir: resolve(process.cwd(), args.runsDir ?? 'logs/runs'),
    outputPath: resolve(process.cwd(), args.output ?? `logs/ops-audits/${endDate}.md`),
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
