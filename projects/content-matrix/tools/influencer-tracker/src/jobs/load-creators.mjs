import { resolve } from 'node:path';
import { readJsonFile } from '../utils/json-file.mjs';
import { FeishuBitableClient, mapFeishuCreatorRecord } from '../feishu/client.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';

export async function loadCreators({ creatorsPath, feishuPath, cwd = process.cwd() }) {
  if (creatorsPath) {
    return {
      creators: await readJsonFile(resolve(cwd, creatorsPath)),
      feishuClient: null,
      feishuConfig: null,
      source: {
        type: 'local-json',
        path: resolve(cwd, creatorsPath),
      },
    };
  }

  if (!feishuPath) {
    throw new Error('Missing --creators or --feishu. Use --dry-run --creators fixtures/creators.example.json for local verification.');
  }

  const resolvedFeishuPath = resolve(cwd, feishuPath);
  const feishuConfig = await readJsonFile(resolvedFeishuPath);
  const configValidation = validateFeishuConfig(feishuConfig);
  if (!configValidation.ok) {
    throw new Error(`Invalid Feishu config: ${configValidation.errors.join('; ')}`);
  }

  const feishuClient = new FeishuBitableClient(feishuConfig);
  const records = await feishuClient.listRecords('creators');
  const creatorsFieldMap = feishuConfig.tables.creators.fields;
  return {
    creators: records.map((record) => mapFeishuCreatorRecord(record, creatorsFieldMap)),
    feishuClient,
    feishuConfig,
    source: {
      type: 'feishu',
      path: resolvedFeishuPath,
    },
  };
}
