import { FeishuBitableClient, mapTopicCandidateToFeishuFields } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';
import { readJsonFile } from '../utils/json-file.mjs';

export async function writeTopicCandidatesToFeishu({ candidates, feishuPath }) {
  if (!feishuPath) {
    return {
      enabled: false,
      createdCount: 0,
      recordIds: [],
    };
  }

  const feishuConfig = await readJsonFile(feishuPath);
  const configValidation = validateFeishuConfig(feishuConfig);
  if (!configValidation.ok) {
    throw new Error(`Invalid Feishu config: ${configValidation.errors.join('; ')}`);
  }

  const client = feishuConfig.mode === 'lark-cli'
    ? new LarkCliBitableClient(feishuConfig)
    : new FeishuBitableClient(feishuConfig);
  const fieldMap = feishuConfig.tables.insights.fields;
  const records = candidates.map((candidate) => mapTopicCandidateToFeishuFields(candidate, fieldMap));
  const created = await client.createRecords('insights', records);

  return {
    enabled: true,
    createdCount: created.length,
    recordIds: created,
  };
}
