import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { FeishuBitableClient, extractFeishuTextField, toFeishuPlatform } from '../feishu/client.mjs';
import { resolveContentLink } from '../platforms/content-link.mjs';
import { readJsonFile, writeJsonFile } from '../utils/json-file.mjs';

const DEFAULT_PENDING_STORE = 'logs/creator-tracking-pending.json';

export async function prepareCreatorTracking({
  sourceUrl,
  topics = [],
  frequency = '手动',
  feishuClient,
  feishuConfig,
  pendingStorePath = DEFAULT_PENDING_STORE,
  resolveLink = resolveContentLink,
}) {
  if (!sourceUrl) throw new Error('Missing creator homepage link');
  const resolved = await resolveLink({ url: sourceUrl });
  if (resolved.kind !== 'creator' || !resolved.creatorId) {
    throw new Error('该链接不是可追踪的博主主页；请发送博主主页链接。');
  }
  if (!['每日', '每周', '手动'].includes(frequency)) {
    throw new Error('检查频率必须是 每日、每周 或 手动');
  }
  const normalizedTopics = normalizeTopics(topics);
  const existing = await findCreator({ feishuClient, feishuConfig, platform: resolved.platform, externalId: resolved.creatorId });
  const pending = await readPending(pendingStorePath);
  const confirmationId = `creator-${randomUUID()}`;
  const draft = {
    confirmationId,
    sourceUrl: resolved.originalUrl,
    homepageUrl: resolved.finalUrl,
    platform: resolved.platform,
    externalId: resolved.creatorId,
    topics: normalizedTopics,
    frequency,
    existingRecordId: existing?.recordId ?? null,
    existingName: existing?.name ?? null,
    createdAt: new Date().toISOString(),
  };
  pending.items.push(draft);
  await writeJsonFile(resolve(pendingStorePath), pending);
  return {
    status: '待确认',
    confirmationId,
    action: existing ? '更新已有博主追踪' : '创建博主追踪',
    missing: missingFields(draft),
    card: renderConfirmationCard(draft),
  };
}

export async function confirmCreatorTracking({
  confirmationId,
  feishuClient,
  feishuConfig,
  pendingStorePath = DEFAULT_PENDING_STORE,
}) {
  if (!confirmationId) throw new Error('Missing confirmationId');
  const pending = await readPending(pendingStorePath);
  const draft = pending.items.find((item) => item.confirmationId === confirmationId);
  if (!draft) throw new Error('找不到待确认的博主追踪请求，请重新发送主页链接。');
  const missing = missingFields(draft);
  if (missing.length > 0) return { status: '待补充', confirmationId, missing, card: renderConfirmationCard(draft) };
  const fields = trackingFields(draft, feishuConfig.tables.creators.fields);
  let recordId = draft.existingRecordId;
  let action = 'updated';
  if (recordId) {
    await feishuClient.updateRecord('creators', recordId, fields);
  } else {
    const ids = await feishuClient.createRecords('creators', [fields]);
    recordId = ids[0]?.record_id ?? ids[0] ?? null;
    action = 'created';
  }
  pending.items = pending.items.filter((item) => item.confirmationId !== confirmationId);
  await writeJsonFile(resolve(pendingStorePath), pending);
  return { status: '已启用', action, recordId, confirmationId, creator: draft };
}

export function createCreatorTrackingFeishuClient(config) {
  return config.mode === 'lark-cli' ? new LarkCliBitableClient(config) : new FeishuBitableClient(config);
}

async function findCreator({ feishuClient, feishuConfig, platform, externalId }) {
  const fields = feishuConfig.tables.creators.fields;
  const records = await feishuClient.listRecords('creators');
  return records.map((record) => ({
    recordId: record.record_id,
    platform: extractFeishuTextField(record, fields.platform),
    externalId: extractFeishuTextField(record, fields.externalId),
    name: extractFeishuTextField(record, fields.name),
  })).find((record) => record.platform === toFeishuPlatform(platform) && record.externalId === externalId) ?? null;
}

async function readPending(filePath) {
  const value = await readJsonFile(resolve(filePath), { items: [] });
  return { items: Array.isArray(value.items) ? value.items : [] };
}

function normalizeTopics(topics) {
  return [...new Set((Array.isArray(topics) ? topics : String(topics).split(/[，,]/)).map((topic) => String(topic).trim()).filter(Boolean))];
}

function missingFields(draft) {
  const missing = [];
  if (draft.topics.length === 0) missing.push('主题');
  return missing;
}

function trackingFields(draft, fields) {
  const name = draft.existingName || `待补充名称-${draft.externalId.slice(0, 8)}`;
  return compact({
    [fields.name]: name,
    [fields.platform]: toFeishuPlatform(draft.platform),
    [fields.externalId]: draft.externalId,
    [fields.homepageUrl]: draft.homepageUrl,
    [fields.sourceLink]: draft.sourceUrl,
    [fields.linkType]: '博主主页',
    [fields.enabledStatus]: '启用',
    [fields.checkFrequency]: draft.frequency,
    [fields.collectAction]: '待检查',
    [fields.taskStatus]: '空闲',
    [fields.sourceKind]: 'TikHub',
    [fields.sourcePath]: `主题：${draft.topics.join('、')}`,
  });
}

function compact(value) { return Object.fromEntries(Object.entries(value).filter(([key, item]) => key && item !== undefined)); }

function renderConfirmationCard(draft) {
  const topics = draft.topics.length ? draft.topics.join('、') : '请补充主题';
  return `确认 ${draft.action ?? '追踪'}\n平台：${toFeishuPlatform(draft.platform)}\n主页：${draft.homepageUrl}\n账号 ID：${draft.externalId}\n主题：${topics}\n频率：${draft.frequency}\n确认 ID：${draft.confirmationId}`;
}
