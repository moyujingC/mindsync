import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseBilibiliSource } from '../src/jobs/diagnose-bilibili-source.mjs';

test('diagnoseBilibiliSource reports working RSSHub source', async () => {
  const result = await diagnoseBilibiliSource({
    uid: '123',
    rsshubBaseUrls: ['https://rsshub-a.example.com'],
    fetchImpl: async () => new Response(`
      <rss><channel>
        <item>
          <title>诊断视频</title>
          <link>https://www.bilibili.com/video/BVdiag12345</link>
          <guid>https://www.bilibili.com/video/BVdiag12345</guid>
          <pubDate>Wed, 15 Jul 2026 01:00:00 GMT</pubDate>
          <description>简介</description>
        </item>
      </channel></rss>
    `, { status: 200 }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.checkedCount, 2);
  assert.equal(result.results[0].ok, true);
  assert.equal(result.results[0].fetchedCount, 1);
  assert.equal(result.results[0].latest.uniqueKey, 'bilibili:BVdiag12345');
});

test('diagnoseBilibiliSource reports failed RSSHub source', async () => {
  const result = await diagnoseBilibiliSource({
    uid: '123',
    rsshubBaseUrls: ['https://rsshub-a.example.com'],
    fetchImpl: async () => new Response('service unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    }),
  });

  assert.equal(result.ok, false);
  assert.match(result.results[0].error, /503 Service Unavailable/);
});
