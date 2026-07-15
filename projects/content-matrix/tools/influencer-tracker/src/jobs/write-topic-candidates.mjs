import {
  FeishuBitableClient,
  buildInsightDedupeKey,
  mapFeishuInsightRecord,
  mapTopicCandidateToFeishuFields,
} from '../feishu/client.mjs';
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
  const existingKeys = await loadExistingInsightKeys(client, fieldMap);
  const newCandidates = candidates.filter((candidate) => {
    const fields = mapTopicCandidateToFeishuFields(candidate, fieldMap);
    const key = buildInsightDedupeKey({
      sourceContentKeys: fields[fieldMap.sourceContentKeys],
      insightType: fields[fieldMap.insightType],
    });
    return key && !existingKeys.has(key);
  });
  const records = newCandidates.map((candidate) => mapTopicCandidateToFeishuFields(candidate, fieldMap));
  const created = await client.createRecords('insights', records);

  return {
    enabled: true,
    createdCount: created.length,
    duplicateCount: candidates.length - newCandidates.length,
    recordIds: created,
  };
}

async function loadExistingInsightKeys(client, fieldMap) {
  const records = await client.listRecords('insights');
  return new Set(
    records
      .map((record) => buildInsightDedupeKey(mapFeishuInsightRecord(record, fieldMap)))
      .filter(Boolean),
  );
}
