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

export async function syncLinkInboxToFeishu({ item, feishuClient, feishuConfig, recordId = null }) {
  if (!feishuClient || !feishuConfig?.tables?.linkInbox) return { synced: false, reason: 'not-configured' };
  const fields = feishuConfig.tables.linkInbox.fields;
  recordId ??= item.feishuRecordId ?? null;
  const mapped = mapLinkInboxToFeishuFields(item, fields);
  if (recordId) {
    await feishuClient.updateRecord('linkInbox', recordId, mapped);
    return { synced: true, action: 'updated', recordId };
  }
  const records = typeof feishuClient.listRecordsByField === 'function'
    ? await feishuClient.listRecordsByField('linkInbox', fields.inboxId, item.inboxId, [fields.inboxId])
    : await feishuClient.listRecords('linkInbox');
  const existing = records.find((record) => extractFeishuTextField(record, fields.inboxId) === item.inboxId);
  if (existing?.record_id) {
    await feishuClient.updateRecord('linkInbox', existing.record_id, mapped);
    return { synced: true, action: 'updated', recordId: existing.record_id };
  }
  const recordIds = await feishuClient.createRecords('linkInbox', [mapped]);
  return { synced: true, action: 'created', recordId: recordIds[0] ?? null };
}

export async function ingestFeishuInboxRows({
  store,
  feishuClient,
  feishuConfig,
  resolveLink,
}) {
  if (!feishuClient || !feishuConfig?.tables?.linkInbox) {
    return { scannedCount: 0, importedCount: 0, duplicateCount: 0, manualReviewCount: 0, errorCount: 0, reason: 'not-configured' };
  }
  const fields = feishuConfig.tables.linkInbox.fields;
  const records = await feishuClient.listRecords('linkInbox');
  const rows = records.filter((record) => isManualInboxRow({ record, fields }));
  const result = {
    scannedCount: rows.length,
    importedCount: 0,
    duplicateCount: 0,
    manualReviewCount: 0,
    errorCount: 0,
  };

  for (const record of rows) {
    const url = extractFeishuTextField(record, fields.originalUrl)
      || extractFeishuTextField(record, fields.finalUrl);
    try {
      const resolved = await resolveLink({ url });
      const received = store.enqueue({
        originalUrl: url,
        resolved,
        source: extractFeishuTextField(record, fields.source) || '飞书网页手工录入',
      });
      if (!received.duplicate) {
        // Keep the originating web row so every later status update stays on it.
        received.item.feishuRecordId = record.record_id;
        result.importedCount += 1;
      } else {
        result.duplicateCount += 1;
      }
      await syncLinkInboxToFeishu({
        item: received.item,
        feishuClient,
        feishuConfig,
        recordId: record.record_id,
      });
      if (received.item.status === '需人工处理') result.manualReviewCount += 1;
    } catch (error) {
      result.errorCount += 1;
      await feishuClient.updateRecord('linkInbox', record.record_id, {
        [fields.status]: '需人工处理',
        [fields.errorSummary]: summarizeError(error),
      });
    }
  }

  await store.save();
  return result;
}

function isManualInboxRow({ record, fields }) {
  const inboxId = extractFeishuTextField(record, fields.inboxId);
  const url = extractFeishuTextField(record, fields.originalUrl)
    || extractFeishuTextField(record, fields.finalUrl);
  const status = extractFeishuTextField(record, fields.status);
  return !inboxId && Boolean(url) && (!status || status === '待处理');
}

function normalizeSource(source) {
  if (typeof source !== 'string' || !source.trim()) return 'unknown';
  return source.trim().slice(0, 80);
}

function summarizeError(error) {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  return message.replace(/\s+/g, ' ').slice(0, 300);
}
