#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { FeishuBitableClient, summarizeFeishuField } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { validateFeishuConfig, validateFeishuTableFields } from '../feishu/config.mjs';

const args = parseArgs(process.argv.slice(2));
const configPath = args.feishu ? resolve(process.cwd(), args.feishu) : null;

try {
  if (!configPath) {
    throw new Error('Missing --feishu config path');
  }

  const config = await readJsonFile(configPath);
  const configValidation = validateFeishuConfig(config);
  if (!configValidation.ok) {
    throw new Error(`Invalid Feishu config: ${configValidation.errors.join('; ')}`);
  }

  const client = config.mode === 'lark-cli'
    ? new LarkCliBitableClient(config)
    : new FeishuBitableClient(config);
  const actualFieldsByTable = {};

  for (const tableName of Object.keys(config.tables)) {
    const fields = await client.listFields(tableName);
    actualFieldsByTable[tableName] = fields.map(summarizeFeishuField);
  }

  const tableValidation = validateFeishuTableFields(config, actualFieldsByTable);
  console.log(JSON.stringify({
    ok: tableValidation.ok,
    errors: tableValidation.errors,
    warnings: tableValidation.warnings,
    tables: actualFieldsByTable,
  }, null, 2));

  process.exitCode = tableValidation.ok ? 0 : 1;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
