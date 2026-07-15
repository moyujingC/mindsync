#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';
import { FEISHU_TABLE_SCHEMAS, buildFieldNameMap } from '../../config/schema.mjs';

const args = parseArgs(process.argv.slice(2));
const configPath = args.feishu ? resolve(process.cwd(), args.feishu) : null;

try {
  if (!configPath) {
    throw new Error('Missing --feishu config path. This command needs appId, appSecret and baseAppToken.');
  }

  const config = await readJsonFile(configPath);
  requireBootstrapConfig(config);

  const client = new FeishuBitableClient(config);
  const existingTables = await client.listTables();
  const existingByName = new Map(existingTables.map((table) => [table.name, table]));
  const outputTables = {};

  for (const [tableKey, schema] of Object.entries(FEISHU_TABLE_SCHEMAS)) {
    const existing = existingByName.get(schema.tableName);
    const table = existing ?? await client.createTable(schema);
    outputTables[tableKey] = {
      tableName: schema.tableName,
      tableId: table.table_id,
      created: !existing,
      fields: buildFieldNameMap(schema),
    };
  }

  const nextConfig = {
    ...config,
    tables: Object.fromEntries(
      Object.entries(outputTables)
        .filter(([tableKey]) => ['creators', 'contents'].includes(tableKey))
        .map(([tableKey, table]) => [tableKey, {
          tableId: table.tableId,
          fields: table.fields,
        }]),
    ),
  };

  const configValidation = validateFeishuConfig(nextConfig);
  console.log(JSON.stringify({
    ok: configValidation.ok,
    errors: configValidation.errors,
    tables: outputTables,
    nextStep: 'Copy nextConfig.tables back into your feishu.local.json, then run inspect-feishu.',
    nextConfig,
  }, null, 2));

  process.exitCode = configValidation.ok ? 0 : 1;
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}

function requireBootstrapConfig(config) {
  for (const key of ['appId', 'appSecret', 'baseAppToken']) {
    if (!config[key] || typeof config[key] !== 'string') {
      throw new Error(`Missing config value: ${key}`);
    }
  }
}
