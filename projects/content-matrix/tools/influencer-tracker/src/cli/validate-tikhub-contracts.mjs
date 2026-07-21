#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { validateTikHubContractFixtures } from '../jobs/validate-tikhub-contracts.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  const platforms = args.platform
    ? String(args.platform).split(',').map((value) => value.trim()).filter(Boolean)
    : undefined;
  const result = await validateTikHubContractFixtures({
    fixtureDir: resolve(process.cwd(), args.fixtureDir ?? 'fixtures/tikhub-contracts/real'),
    platforms,
  });
  console.log(JSON.stringify({ ok: result.ok, ...result }, null, 2));
  if (!result.ok) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
