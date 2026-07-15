import { ContentStore } from '../storage/content-store.mjs';
import { getPlatformAdapter } from '../platforms/registry.mjs';
import { extractFeishuTextField, mapContentToFeishuFields } from '../feishu/client.mjs';

export async function checkUpdates({
  creators,
  feishuClient,
  feishuConfig,
  storePath,
  dryRun = false,
  platform,
  limitPerCreator = 10,
  cwd,
}) {
  const store = new ContentStore({ filePath: storePath });
  await store.load();
  const remoteContentKeys = await loadRemoteContentKeys({ feishuClient, feishuConfig, dryRun });

  const enabledCreators = creators.filter((creator) => {
    const enabled = creator.enabledStatus === '启用';
    const platformMatched = !platform || creator.platform === platform;
    return enabled && platformMatched;
  });

  const run = {
    startedAt: new Date().toISOString(),
    dryRun,
    creatorCount: enabledCreators.length,
    createdCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    creatorResults: [],
  };

  for (const creator of enabledCreators) {
    const creatorResult = {
      creatorId: creator.id,
      creatorName: creator.name,
      platform: creator.platform,
      fetchedCount: 0,
      createdCount: 0,
      duplicateCount: 0,
      failed: false,
      error: null,
    };

    try {
      validateCreator(creator);
      const adapter = getPlatformAdapter(creator.platform);
      const contents = await adapter(creator, { cwd });
      const limitedContents = contents.slice(0, limitPerCreator);
      creatorResult.fetchedCount = limitedContents.length;

      const newContents = [];
      for (const content of limitedContents) {
        if (store.hasContent(content.uniqueKey) || remoteContentKeys.has(content.uniqueKey)) {
          creatorResult.duplicateCount += 1;
          run.duplicateCount += 1;
          continue;
        }
        newContents.push(content);
      }

      if (!dryRun && feishuClient && newContents.length > 0) {
        const fieldMap = feishuConfig.tables.contents.fields;
        const records = newContents.map((content) => mapContentToFeishuFields(content, fieldMap));
        await feishuClient.createRecords('contents', records);
      }

      for (const content of newContents) {
        store.addContent(content.uniqueKey);
        remoteContentKeys.add(content.uniqueKey);
      }
      creatorResult.createdCount = newContents.length;
      run.createdCount += newContents.length;

      if (!dryRun && feishuClient && creator.recordId) {
        await updateCreatorStatus(feishuClient, feishuConfig, creator, {
          lastStatus: '正常',
          failureReason: '',
          latestContentAt: latestPublishedAt(limitedContents),
        });
      }

      creatorResult.contents = newContents;
    } catch (error) {
      creatorResult.failed = true;
      creatorResult.error = error.message;
      run.failedCount += 1;
      if (!dryRun && feishuClient && creator.recordId) {
        await updateCreatorStatus(feishuClient, feishuConfig, creator, {
          lastStatus: '失败',
          failureReason: error.message,
        });
      }
    }

    run.creatorResults.push(creatorResult);
  }

  run.finishedAt = new Date().toISOString();
  store.addRun(run);
  if (!dryRun) {
    await store.save();
  }

  return run;
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

function validateCreator(creator) {
  if (!creator.name) {
    throw new Error('Missing creator name');
  }
  if (!creator.platform) {
    throw new Error('Missing platform');
  }
  if (!creator.externalId) {
    throw new Error('Missing platform account ID');
  }
}

async function updateCreatorStatus(feishuClient, feishuConfig, creator, status) {
  const fieldMap = feishuConfig.tables.creators.fields;
  const fields = {
    [fieldMap.lastCheckedAt]: new Date().toISOString(),
    [fieldMap.lastStatus]: status.lastStatus,
  };
  if (status.latestContentAt) {
    fields[fieldMap.latestContentAt] = status.latestContentAt;
  }
  if (status.failureReason !== undefined) {
    fields[fieldMap.failureReason] = status.failureReason;
  }
  await feishuClient.updateRecord('creators', creator.recordId, fields);
}

function latestPublishedAt(contents) {
  const timestamps = contents
    .map((content) => content.publishedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));
  if (timestamps.length === 0) {
    return undefined;
  }
  return new Date(Math.max(...timestamps)).toISOString();
}
