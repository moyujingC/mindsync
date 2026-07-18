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

test('checkUpdates deduplicates against existing Feishu content keys', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-feishu-dedupe-'));
  const storePath = join(dir, 'store.json');
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => new Response(`
    <rss><channel>
      <item>
        <title>第一条</title>
        <link>https://www.bilibili.com/video/BV3333333333</link>
        <guid>https://www.bilibili.com/video/BV3333333333</guid>
        <pubDate>Wed, 15 Jul 2026 01:00:00 GMT</pubDate>
        <description>简介</description>
      </item>
    </channel></rss>
  `, { status: 200 });

  const createdRecords = [];
  const feishuClient = {
    async listRecords(tableName) {
      assert.equal(tableName, 'contents');
      return [{
        record_id: 'rec_existing',
        fields: {
          内容唯一键: 'bilibili:BV3333333333',
        },
      }];
    },
    async createRecords(tableName, records) {
      createdRecords.push({ tableName, records });
      return [];
    },
  };

  try {
    const result = await checkUpdates({
      creators: [{
        id: 'enabled',
        name: '启用账号',
        platform: 'bilibili',
        externalId: '2',
        enabledStatus: '启用',
      }],
      feishuClient,
      feishuConfig: {
        tables: {
          contents: {
            fields: {
              uniqueKey: '内容唯一键',
            },
          },
        },
      },
      storePath,
      dryRun: false,
    });

    assert.equal(result.createdCount, 0);
    assert.equal(result.duplicateCount, 1);
    assert.deepEqual(createdRecords, []);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  }
});

test('checkUpdates passes platform RSSHub config to Bilibili adapter', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-platform-config-'));
  const storePath = join(dir, 'store.json');
  const originalFetch = globalThis.fetch;
  const requestedUrls = [];

  globalThis.fetch = async (url) => {
    requestedUrls.push(String(url));
    return new Response(`
      <rss><channel>
        <item>
          <title>平台配置测试</title>
          <link>https://www.bilibili.com/video/BV4444444444</link>
          <guid>https://www.bilibili.com/video/BV4444444444</guid>
          <pubDate>Wed, 15 Jul 2026 01:00:00 GMT</pubDate>
          <description>简介</description>
        </item>
      </channel></rss>
    `, { status: 200 });
  };

  try {
    const result = await checkUpdates({
      creators: [{
        id: 'enabled',
        name: '启用账号',
        platform: 'bilibili',
        externalId: '444',
        enabledStatus: '启用',
      }],
      feishuConfig: {
        platforms: {
          bilibili: {
            rsshubBaseUrls: ['https://rsshub-config.example.com'],
          },
        },
      },
      storePath,
      dryRun: true,
    });

    assert.equal(result.createdCount, 1);
    assert.deepEqual(requestedUrls, [
      'https://rsshub-config.example.com/bilibili/user/video/444',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  }
});
