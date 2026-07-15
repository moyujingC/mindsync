#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';

const args = parseArgs(process.argv.slice(2));
const configPath = args.feishu ? resolve(process.cwd(), args.feishu) : null;

try {
  if (!configPath) {
    throw new Error('Missing --feishu config path');
  }

  const config = await readJsonFile(configPath);
  const result = validateFeishuConfig(config);
  if (!result.ok) {
    console.error(JSON.stringify({
      ok: false,
      errors: result.errors,
    }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({
      ok: true,
      message: 'Feishu config shape is valid.',
    }, null, 2));
  }
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
