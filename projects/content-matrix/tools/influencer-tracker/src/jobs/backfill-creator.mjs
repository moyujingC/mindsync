import { ContentStore } from '../storage/content-store.mjs';
import { getPlatformAdapter } from '../platforms/registry.mjs';
import { extractFeishuTextField, mapContentToFeishuFields } from '../feishu/client.mjs';

export async function backfillCreator({
  creators,
  creatorId,
  creatorName,
  feishuClient,
  feishuConfig,
  storePath,
  dryRun = false,
  limit = 20,
  since,
  cwd,
}) {
  const creator = selectCreator({ creators, creatorId, creatorName });
  const store = new ContentStore({ filePath: storePath });
  await store.load();
  const remoteContentKeys = await loadRemoteContentKeys({ feishuClient, feishuConfig, dryRun });

  const adapter = getPlatformAdapter(creator.platform);
  const fetched = await adapter(creator, {
    cwd,
    platformConfig: feishuConfig?.platforms?.[creator.platform],
  });
  const filtered = fetched
    .filter((content) => !since || isOnOrAfter(content.publishedAt, since))
    .slice(0, limit);

  const newContents = [];
  let duplicateCount = 0;
  for (const content of filtered) {
    if (store.hasContent(content.uniqueKey) || remoteContentKeys.has(content.uniqueKey)) {
      duplicateCount += 1;
      continue;
    }
    newContents.push(content);
  }

  let recordIds = [];
  if (!dryRun && feishuClient && newContents.length > 0) {
    const fieldMap = feishuConfig.tables.contents.fields;
    const records = newContents.map((content) => mapContentToFeishuFields(content, fieldMap));
    recordIds = await feishuClient.createRecords('contents', records);
  }

  if (!dryRun) {
    for (const content of newContents) {
      store.addContent(content.uniqueKey);
    }
    store.addRun({
      type: 'backfill-creator',
      creatorId: creator.id,
      creatorName: creator.name,
      importedAt: new Date().toISOString(),
      createdCount: newContents.length,
      duplicateCount,
      limit,
      since: since ?? null,
    });
    await store.save();
  }

  return {
    creatorId: creator.id,
    creatorName: creator.name,
    fetchedCount: fetched.length,
    candidateCount: filtered.length,
    createdCount: newContents.length,
    duplicateCount,
    dryRun,
    recordIds,
    contents: newContents,
  };
}

export function selectCreator({ creators, creatorId, creatorName }) {
  if (creatorId) {
    const matched = creators.find((creator) => creator.id === creatorId || creator.recordId === creatorId);
    if (!matched) {
      throw new Error(`Creator not found by id: ${creatorId}`);
    }
    return matched;
  }
  if (creatorName) {
    const matched = creators.find((creator) => creator.name === creatorName);
    if (!matched) {
      throw new Error(`Creator not found by name: ${creatorName}`);
    }
    return matched;
  }
  throw new Error('Missing --creator-id or --creator-name');
}

async function loadRemoteContentKeys({ feishuClient, feishuConfig, dryRun }) {
  if (dryRun || !feishuClient || !feishuConfig) {
    return new Set();
  }
  const uniqueKeyField = feishuConfig.tables.contents.fields.uniqueKey;
  const records = await feishuClient.listRecords('contents');
  return new Set(
    records
      .map((record) => extractFeishuTextField(record, uniqueKeyField))
      .filter(Boolean),
  );
}

function isOnOrAfter(publishedAt, since) {
  if (!publishedAt) {
    return false;
  }
  const published = new Date(publishedAt).getTime();
  const lowerBound = new Date(since).getTime();
  if (Number.isNaN(published) || Number.isNaN(lowerBound)) {
    return false;
  }
  return published >= lowerBound;
}
