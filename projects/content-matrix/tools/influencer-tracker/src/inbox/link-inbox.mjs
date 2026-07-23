import { extractFeishuTextField, mapLinkInboxToFeishuFields } from '../feishu/client.mjs';
import { LinkInboxStore } from '../storage/link-inbox-store.mjs';

export async function receiveLink({
  url,
  source = 'iphone-back-tap',
  storePath,
  resolveLink,
  feishuClient = null,
  feishuConfig = null,
}) {
  if (!url?.trim()) throw new Error('Missing content link');
  const resolved = await resolveLink({ url: url.trim() });
  const store = new LinkInboxStore({ filePath: storePath });
  await store.load();
  const received = store.enqueue({ originalUrl: url.trim(), resolved, source: normalizeSource(source) });
  await store.save();
  try {
    const synced = await syncLinkInboxToFeishu({ item: received.item, feishuClient, feishuConfig });
    return { ...received, feishu: synced };
  } catch (error) {
    // The durable local queue remains the receipt source if Feishu is temporarily unavailable.
    return { ...received, feishu: { synced: false, reason: 'sync-failed', error: summarizeError(error) } };
  }
}

export async function syncLinkInboxToFeishu({ item, feishuClient, feishuConfig }) {
  if (!feishuClient || !feishuConfig?.tables?.linkInbox) return { synced: false, reason: 'not-configured' };
  const fields = feishuConfig.tables.linkInbox.fields;
  const records = typeof feishuClient.listRecordsByField === 'function'
    ? await feishuClient.listRecordsByField('linkInbox', fields.inboxId, item.inboxId, [fields.inboxId])
    : await feishuClient.listRecords('linkInbox');
  const existing = records.find((record) => extractFeishuTextField(record, fields.inboxId) === item.inboxId);
  const mapped = mapLinkInboxToFeishuFields(item, fields);
  if (existing?.record_id) {
    await feishuClient.updateRecord('linkInbox', existing.record_id, mapped);
    return { synced: true, action: 'updated', recordId: existing.record_id };
  }
  const recordIds = await feishuClient.createRecords('linkInbox', [mapped]);
  return { synced: true, action: 'created', recordId: recordIds[0] ?? null };
}

function normalizeSource(source) {
  if (typeof source !== 'string' || !source.trim()) return 'unknown';
  return source.trim().slice(0, 80);
}

function summarizeError(error) {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  return message.replace(/\s+/g, ' ').slice(0, 300);
}
