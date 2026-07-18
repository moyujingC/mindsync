import { ContentStore } from '../storage/content-store.mjs';
import { FeishuBitableClient, extractFeishuTextField, mapContentToFeishuFields } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';
import { readJsonFile } from '../utils/json-file.mjs';

export async function importManualContents({
  inputPath,
  storePath,
  feishuPath,
  dryRun = false,
}) {
  const input = await readJsonFile(inputPath);
  const items = Array.isArray(input) ? input : input.items;
  return importManualContentItems({
    items,
    storePath,
    feishuPath,
    dryRun,
    inputPath,
  });
}

export async function importManualContentItems({
  items,
  storePath,
  feishuPath = null,
  feishuClient = null,
  feishuConfig = null,
  dryRun = false,
  inputPath = null,
  runType = 'manual-import',
}) {
  const contents = normalizeManualInput({ items });
  const store = new ContentStore({ filePath: storePath });
  await store.load();

  const loaded = feishuClient && feishuConfig
    ? { feishuClient, feishuConfig }
    : feishuPath
    ? await loadFeishu(feishuPath)
    : { feishuClient: null, feishuConfig: null };
  const remoteContentKeys = await loadRemoteContentKeys({
    feishuClient: loaded.feishuClient,
    feishuConfig: loaded.feishuConfig,
    dryRun,
  });

  const newContents = [];
  let duplicateCount = 0;
  for (const content of contents) {
    if (store.hasContent(content.uniqueKey) || remoteContentKeys.has(content.uniqueKey)) {
      duplicateCount += 1;
      continue;
    }
    newContents.push(content);
  }

  let recordIds = [];
  if (!dryRun && loaded.feishuClient && newContents.length > 0) {
    const fieldMap = loaded.feishuConfig.tables.contents.fields;
    const records = newContents.map((content) => mapContentToFeishuFields(content, fieldMap));
    recordIds = await loaded.feishuClient.createRecords('contents', records);
  }

  if (!dryRun) {
    for (const content of newContents) {
      store.addContent(content.uniqueKey);
    }
    store.addRun({
      type: runType,
      importedAt: new Date().toISOString(),
      inputPath,
      createdCount: newContents.length,
      duplicateCount,
    });
    await store.save();
  }

  return {
    inputCount: contents.length,
    createdCount: newContents.length,
    duplicateCount,
    dryRun,
    recordIds,
    contents: newContents,
  };
}

export function normalizeManualInput(input) {
  const items = Array.isArray(input) ? input : input.items;
  if (!Array.isArray(items)) {
    throw new Error('Manual import input must be an array or { items: [...] }');
  }
  return items.map((item, index) => normalizeManualItem(item, index));
}

function normalizeManualItem(item, index) {
  const platform = requiredString(item.platform, `items[${index}].platform`);
  const url = requiredString(item.url, `items[${index}].url`);
  const title = requiredString(item.title, `items[${index}].title`);
  const externalId = item.externalId ?? stableExternalIdFromUrl(url);
  const creatorName = item.creatorName ?? item.creator ?? '随机发现';
  const publishedAt = item.publishedAt ?? new Date().toISOString();
  return {
    uniqueKey: buildManualContentKey({ platform, externalId, url }),
    platform,
    creatorName,
    contentExternalId: externalId,
    url,
    title,
    description: item.description ?? item.body ?? '',
    publishedAt,
    contentType: normalizeContentType(item.contentType),
    tags: undefined,
    metrics: {
      likeCount: numberOrUndefined(item.likeCount),
      commentCount: numberOrUndefined(item.commentCount),
      favoriteCount: numberOrUndefined(item.favoriteCount),
      shareCount: numberOrUndefined(item.shareCount),
    },
    raw: item,
  };
}

function buildManualContentKey({ platform, externalId, url }) {
  return `${platform}:${externalId || stableExternalIdFromUrl(url)}`;
}

function stableExternalIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    const path = `${parsed.hostname}${parsed.pathname}`.replace(/\/$/, '');
    return path || url;
  } catch {
    return url;
  }
}

async function loadFeishu(feishuPath) {
  const feishuConfig = await readJsonFile(feishuPath);
  const configValidation = validateFeishuConfig(feishuConfig);
  if (!configValidation.ok) {
    throw new Error(`Invalid Feishu config: ${configValidation.errors.join('; ')}`);
  }
  const feishuClient = feishuConfig.mode === 'lark-cli'
    ? new LarkCliBitableClient(feishuConfig)
    : new FeishuBitableClient(feishuConfig);
  return { feishuClient, feishuConfig };
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

function requiredString(value, path) {
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing manual import field: ${path}`);
  }
  return value;
}

function numberOrUndefined(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeContentType(contentType) {
  if (!contentType) {
    return '图文';
  }
  if (contentType === '视频') {
    return 'video';
  }
  return contentType;
}
