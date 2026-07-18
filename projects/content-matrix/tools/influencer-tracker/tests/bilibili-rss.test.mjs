import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchBilibiliContents } from '../src/platforms/bilibili/rss.mjs';
import { internals } from '../src/platforms/bilibili/rss.mjs';

test('parseRssItems extracts Bilibili RSS items', () => {
  const xml = `
    <rss><channel>
      <item>
        <title><![CDATA[测试视频]]></title>
        <link>https://www.bilibili.com/video/BV1abc123456</link>
        <guid>https://www.bilibili.com/video/BV1abc123456</guid>
        <pubDate>Wed, 15 Jul 2026 01:00:00 GMT</pubDate>
        <description><![CDATA[<p>视频简介 &amp; 标签</p>]]></description>
      </item>
    </channel></rss>
  `;

  const items = internals.parseRssItems(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, '测试视频');
  assert.equal(items[0].link, 'https://www.bilibili.com/video/BV1abc123456');
  assert.equal(items[0].description, '视频简介 & 标签');
});

test('normalizeBilibiliRssItem creates stable unique key', () => {
  const content = internals.normalizeBilibiliRssItem({
    title: '测试视频',
    link: 'https://www.bilibili.com/video/BV1abc123456',
    guid: 'https://www.bilibili.com/video/BV1abc123456',
    pubDate: 'Wed, 15 Jul 2026 01:00:00 GMT',
    description: '简介',
  }, {
    name: '样例账号',
    externalId: '2',
  });

  assert.equal(content.platform, 'bilibili');
  assert.equal(content.contentExternalId, 'BV1abc123456');
  assert.equal(content.uniqueKey, 'bilibili:BV1abc123456');
  assert.equal(content.creatorName, '样例账号');
  assert.equal(content.publishedAt, '2026-07-15T01:00:00.000Z');
});

test('fetchRss reports source URL and network reason on fetch failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const error = new TypeError('fetch failed');
    error.cause = { code: 'UND_ERR_CONNECT_TIMEOUT' };
    throw error;
  };

  try {
    await assert.rejects(
      () => internals.fetchRss('https://rsshub.app/bilibili/user/video/123', undefined),
      /url=https:\/\/rsshub\.app\/bilibili\/user\/video\/123; reason=UND_ERR_CONNECT_TIMEOUT/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('buildBilibiliRssUrls supports configured RSSHub base URLs', () => {
  const urls = internals.buildBilibiliRssUrls({
    externalId: '123',
  }, {
    platformConfig: {
      rsshubBaseUrls: [
        'https://rsshub-a.example.com',
        'https://rsshub-b.example.com/',
      ],
    },
  });

  assert.deepEqual(urls, [
    'https://rsshub-a.example.com/bilibili/user/video/123',
    'https://rsshub-b.example.com/bilibili/user/video/123',
    'https://rsshub.app/bilibili/user/video/123',
  ]);
});

test('buildBilibiliRssUrls expands configured source URL with fallback bases', () => {
  const urls = internals.buildBilibiliRssUrls({
    externalId: 'ignored',
    source: {
      kind: 'rss',
      url: 'https://rsshub.app/bilibili/user/video/123',
    },
  }, {
    platformConfig: {
      rsshubBaseUrls: ['https://rsshub-a.example.com'],
    },
  });

  assert.deepEqual(urls, [
    'https://rsshub-a.example.com/bilibili/user/video/123',
    'https://rsshub.app/bilibili/user/video/123',
  ]);
});

test('buildBilibiliRssUrls can disable source URL expansion for diagnosis', () => {
  const urls = internals.buildBilibiliRssUrls({
    externalId: 'ignored',
    source: {
      kind: 'rss',
      url: 'https://rsshub.app/bilibili/user/video/123',
    },
  }, {
    disableRsshubExpansion: true,
    platformConfig: {
      rsshubBaseUrls: ['https://rsshub-a.example.com'],
    },
  });

  assert.deepEqual(urls, [
    'https://rsshub.app/bilibili/user/video/123',
  ]);
});

test('parseRsshubBilibiliUrl extracts user id from RSSHub route', () => {
  assert.deepEqual(
    internals.parseRsshubBilibiliUrl('https://rsshub.app/bilibili/user/video/123'),
    { baseUrl: 'https://rsshub.app', externalId: '123' },
  );
  assert.equal(internals.parseRsshubBilibiliUrl('https://example.com/other/123'), null);
});

test('fetchFirstRss tries configured RSSHub URLs in order', async () => {
  const originalFetch = globalThis.fetch;
  const attempted = [];
  globalThis.fetch = async (url) => {
    attempted.push(String(url));
    if (attempted.length === 1) {
      throw new TypeError('fetch failed');
    }
    return new Response('<rss><channel></channel></rss>', { status: 200 });
  };

  try {
    const response = await internals.fetchFirstRss([
      'https://rsshub-a.example.com/bilibili/user/video/123',
      'https://rsshub-b.example.com/bilibili/user/video/123',
    ]);
    assert.equal(response.status, 200);
    assert.deepEqual(attempted, [
      'https://rsshub-a.example.com/bilibili/user/video/123',
      'https://rsshub-b.example.com/bilibili/user/video/123',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchFirstRss continues after failed HTTP status', async () => {
  const originalFetch = globalThis.fetch;
  const attempted = [];
  globalThis.fetch = async (url) => {
    attempted.push(String(url));
    if (attempted.length === 1) {
      return new Response('bad gateway', { status: 502, statusText: 'Bad Gateway' });
    }
    return new Response('<rss><channel></channel></rss>', { status: 200 });
  };

  try {
    const response = await internals.fetchFirstRss([
      'https://rsshub-a.example.com/bilibili/user/video/123',
      'https://rsshub-b.example.com/bilibili/user/video/123',
    ]);
    assert.equal(response.status, 200);
    assert.deepEqual(attempted, [
      'https://rsshub-a.example.com/bilibili/user/video/123',
      'https://rsshub-b.example.com/bilibili/user/video/123',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchBilibiliContents falls back to yt-dlp when enabled', async () => {
  const contents = await fetchBilibiliContents({
    name: '第四种黑猩猩',
    externalId: '3546830396721763',
  }, {
    platformConfig: {
      ytDlpFallback: true,
    },
    fetchImpl: async () => new Response('bad gateway', {
      status: 503,
      statusText: 'Service Unavailable',
    }),
    execFileImpl: async () => ({
      stdout: `${JSON.stringify({
        id: 'BV166Ni6JESi',
        url: 'https://www.bilibili.com/video/BV166Ni6JESi',
      })}\n`,
    }),
  });

  assert.equal(contents.length, 1);
  assert.equal(contents[0].uniqueKey, 'bilibili:BV166Ni6JESi');
  assert.equal(contents[0].raw.source, 'yt-dlp-flat-playlist');
});

test('fetchBilibiliContents caps yt-dlp fallback limit at five by default', async () => {
  let playlistEnd = null;
  await fetchBilibiliContents({
    name: '第四种黑猩猩',
    externalId: '3546830396721763',
  }, {
    limit: 20,
    platformConfig: {
      ytDlpFallback: true,
    },
    fetchImpl: async () => new Response('bad gateway', {
      status: 503,
      statusText: 'Service Unavailable',
    }),
    execFileImpl: async (bin, args) => {
      playlistEnd = args[args.indexOf('--playlist-end') + 1];
      return {
        stdout: `${JSON.stringify({
          id: 'BV166Ni6JESi',
          url: 'https://www.bilibili.com/video/BV166Ni6JESi',
        })}\n`,
      };
    },
  });

  assert.equal(playlistEnd, '5');
});
