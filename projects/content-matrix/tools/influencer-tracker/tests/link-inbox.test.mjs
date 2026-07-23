import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { receiveLink } from '../src/inbox/link-inbox.mjs';
import { processNextLinkInbox, retryLinkInbox } from '../src/inbox/link-inbox-worker.mjs';
import { LinkInboxStore } from '../src/storage/link-inbox-store.mjs';

test('receiveLink persists a resolved content link and deduplicates its final URL', async () => {
  await withInbox(async (storePath) => {
    const first = await receiveLink({
      url: 'https://v.douyin.com/short-001',
      storePath,
      resolveLink: async () => resolvedContent(),
    });
    const second = await receiveLink({
      url: 'https://www.douyin.com/video/1234567890',
      storePath,
      resolveLink: async () => resolvedContent(),
    });

    assert.equal(first.duplicate, false);
    assert.equal(first.item.status, '待处理');
    assert.equal(first.item.platform, 'douyin');
    assert.equal(second.duplicate, true);
    assert.equal(second.item.inboxId, first.item.inboxId);
  });
});

test('receiveLink sends creator links to manual review without queuing collection', async () => {
  await withInbox(async (storePath) => {
    const received = await receiveLink({
      url: 'https://www.douyin.com/user/example',
      storePath,
      resolveLink: async () => ({ ...resolvedContent(), kind: 'creator', contentId: null }),
    });
    const store = new LinkInboxStore({ filePath: storePath });
    await store.load();

    assert.equal(received.item.status, '需人工处理');
    assert.equal(store.claimNext(), null);
  });
});

test('worker completes one queued item and writes the research result trace', async () => {
  await withInbox(async (storePath) => {
    const received = await receiveLink({
      url: 'https://www.douyin.com/video/1234567890',
      storePath,
      resolveLink: async () => resolvedContent(),
    });
    const result = await processNextLinkInbox({
      storePath,
      processItem: async (item) => {
        assert.equal(item.status, '处理中');
        return { requestId: 'research-inbox-001', collection: { contentKeys: ['douyin:1234567890'] } };
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.item.inboxId, received.item.inboxId);
    assert.equal(result.item.status, '已完成');
    assert.match(result.item.result, /research-inbox-001/);
    assert.match(result.item.result, /douyin:1234567890/);
  });
});

test('worker records failures and retry returns a failed item to the queue', async () => {
  await withInbox(async (storePath) => {
    const received = await receiveLink({
      url: 'https://www.douyin.com/video/1234567890',
      storePath,
      resolveLink: async () => resolvedContent(),
    });
    const failed = await processNextLinkInbox({
      storePath,
      processItem: async () => { throw new Error('TikHub request failed: 402'); },
    });
    const retried = await retryLinkInbox({ storePath, inboxId: received.item.inboxId });

    assert.equal(failed.ok, false);
    assert.equal(failed.item.status, '失败');
    assert.equal(failed.item.retryCount, 1);
    assert.match(failed.item.errorSummary, /402/);
    assert.equal(retried.item.status, '待处理');
    assert.equal(retried.item.errorSummary, '');
  });
});

test('worker completion survives an optional notification failure', async () => {
  await withInbox(async (storePath) => {
    await receiveLink({
      url: 'https://www.douyin.com/video/1234567890',
      storePath,
      resolveLink: async () => resolvedContent(),
    });
    const result = await processNextLinkInbox({
      storePath,
      processItem: async () => ({ requestId: 'research-notification-001' }),
      notify: async () => { throw new Error('group unavailable'); },
    });

    assert.equal(result.ok, true);
    assert.equal(result.item.status, '已完成');
  });
});

test('receiveLink keeps a local receipt when optional Feishu sync fails', async () => {
  await withInbox(async (storePath) => {
    const received = await receiveLink({
      url: 'https://www.douyin.com/video/1234567890',
      storePath,
      resolveLink: async () => resolvedContent(),
      feishuConfig: { tables: { linkInbox: { fields: { inboxId: '收件ID' } } } },
      feishuClient: { async listRecordsByField() { throw new Error('Feishu unavailable'); } },
    });
    const raw = JSON.parse(await readFile(storePath, 'utf8'));

    assert.equal(received.feishu.synced, false);
    assert.equal(received.feishu.reason, 'sync-failed');
    assert.equal(raw.records.length, 1);
  });
});

async function withInbox(run) {
  const dir = await mkdtemp(join(tmpdir(), 'link-inbox-'));
  try {
    await run(join(dir, 'link-inbox.json'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function resolvedContent() {
  return {
    originalUrl: 'https://v.douyin.com/short-001',
    finalUrl: 'https://www.douyin.com/video/1234567890',
    redirects: ['https://www.douyin.com/video/1234567890'],
    platform: 'douyin',
    kind: 'content',
    contentId: '1234567890',
  };
}
