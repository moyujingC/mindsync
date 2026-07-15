import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkUpdates } from '../src/jobs/check-updates.mjs';

test('checkUpdates handles enabled creators and deduplicates local store', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-'));
  const storePath = join(dir, 'store.json');
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => new Response(`
    <rss><channel>
      <item>
        <title>第一条</title>
        <link>https://www.bilibili.com/video/BV1111111111</link>
        <guid>https://www.bilibili.com/video/BV1111111111</guid>
        <pubDate>Wed, 15 Jul 2026 01:00:00 GMT</pubDate>
        <description>简介</description>
      </item>
    </channel></rss>
  `, { status: 200 });

  try {
    const creators = [
      {
        id: 'enabled',
        name: '启用账号',
        platform: 'bilibili',
        externalId: '2',
        enabledStatus: '启用',
      },
      {
        id: 'paused',
        name: '暂停账号',
        platform: 'bilibili',
        externalId: '3',
        enabledStatus: '暂停',
      },
    ];

    const first = await checkUpdates({
      creators,
      storePath,
      dryRun: false,
    });
    assert.equal(first.creatorCount, 1);
    assert.equal(first.createdCount, 1);
    assert.equal(first.duplicateCount, 0);

    const second = await checkUpdates({
      creators,
      storePath,
      dryRun: false,
    });
    assert.equal(second.creatorCount, 1);
    assert.equal(second.createdCount, 0);
    assert.equal(second.duplicateCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  }
});

test('checkUpdates dry-run does not persist store', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-dry-run-'));
  const storePath = join(dir, 'store.json');
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => new Response(`
    <rss><channel>
      <item>
        <title>第一条</title>
        <link>https://www.bilibili.com/video/BV2222222222</link>
        <guid>https://www.bilibili.com/video/BV2222222222</guid>
        <pubDate>Wed, 15 Jul 2026 01:00:00 GMT</pubDate>
        <description>简介</description>
      </item>
    </channel></rss>
  `, { status: 200 });

  try {
    const creators = [{
      id: 'enabled',
      name: '启用账号',
      platform: 'bilibili',
      externalId: '2',
      enabledStatus: '启用',
    }];

    const first = await checkUpdates({ creators, storePath, dryRun: true });
    const second = await checkUpdates({ creators, storePath, dryRun: true });

    assert.equal(first.createdCount, 1);
    assert.equal(second.createdCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  }
});
