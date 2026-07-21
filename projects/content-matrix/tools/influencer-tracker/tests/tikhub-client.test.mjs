import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { TikHubClient } from '../src/platforms/tikhub/client.mjs';
import { extractTikHubPage, normalizeTikHubComments, normalizeTikHubContent } from '../src/platforms/tikhub/normalize.mjs';

test('TikHubClient fetches Xiaohongshu detail from a share link and records cache metadata', async () => {
  const requests = [];
  const client = new TikHubClient({
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return jsonResponse({
        code: 200,
        data: {
          note_id: 'xhs-001',
          title: '企业 AI 从哪个流程开始试点',
          desc: '从真实工作流开始，而不是先采购工具。',
          user: { nickname: 'AI 实践者', user_id: 'creator-001' },
          interact_info: { liked_count: '12', collected_count: '8', comment_count: '3', share_count: '2' },
          time: 1_784_041_200,
          type: 'normal',
        },
        cache_url: 'https://cache.tikhub.example/xhs-001',
      });
    },
  });

  const result = await client.getContentDetail({
    platform: 'xiaohongshu',
    shareUrl: 'https://www.xiaohongshu.com/explore/xhs-001',
  });

  assert.match(String(requests[0].url), /xiaohongshu\/app_v2\/get_image_note_detail/);
  assert.match(String(requests[0].url), /share_text=/);
  assert.equal(result.cacheUrl, 'https://cache.tikhub.example/xhs-001');
  assert.equal(result.audit.requestCount, 1);
  assert.equal(result.data.note_id, 'xhs-001');
});

test('TikHubClient refuses to make a request without an API key', async () => {
  let called = false;
  const client = new TikHubClient({
    fetchImpl: async () => {
      called = true;
      return jsonResponse({});
    },
  });

  await assert.rejects(
    () => client.searchContents({ platform: 'douyin', keyword: '企业 AI' }),
    /Missing TIKHUB_API_KEY/,
  );
  assert.equal(called, false);
});

test('TikHubClient explains a 402 response as a TikHub account entitlement issue', async () => {
  const client = new TikHubClient({
    apiKey: 'test-key',
    fetchImpl: async () => ({
      ok: false,
      status: 402,
      async json() {
        return { code: 402, message: 'payment required' };
      },
    }),
  });

  await assert.rejects(
    () => client.searchContents({ platform: 'xiaohongshu', keyword: '企业 AI' }),
    /TikHub returned 402: check account balance or endpoint entitlement/,
  );
});

test('TikHubClient uses each platform detail identifier contract', async () => {
  const requests = [];
  const client = new TikHubClient({
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), options });
      return jsonResponse({ code: 200, data: {} });
    },
  });

  await client.getContentDetail({ platform: 'douyin', shareUrl: 'https://v.douyin.com/example' });
  await client.getContentDetail({ platform: 'wechat_mp', shareUrl: 'https://mp.weixin.qq.com/s/example' });
  await client.getContentDetail({ platform: 'wechat_channels', shareUrl: 'https://weixin.qq.com/sph/example' });

  assert.match(requests[0].url, /share_url=/);
  assert.match(requests[1].url, /wechat_mp\/v2\/fetch_article_detail$/);
  assert.equal(requests[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[1].options.body), { url: 'https://mp.weixin.qq.com/s/example', raw: true });
  assert.match(requests[2].url, /wechat_channels\/v2\/fetch_video_detail$/);
  assert.equal(requests[2].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[2].options.body), { share_url: 'https://weixin.qq.com/sph/example', raw: true });
});

test('TikHubClient uses documented creator and comment contracts for WeChat platforms', async () => {
  const requests = [];
  const client = new TikHubClient({
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), options });
      return jsonResponse({ code: 200, data: {} });
    },
  });

  await client.getCreatorContents({ platform: 'wechat_mp', creatorId: 'gh_example', cursor: 'next', limit: 4 });
  await client.getCreatorContents({ platform: 'wechat_channels', creatorId: 'v2_abcdef@finder', cursor: 'next' });
  await client.getComments({ platform: 'wechat_mp', contentId: 'ignored', shareUrl: 'https://mp.weixin.qq.com/s/example', cursor: 'next' });
  await client.getComments({ platform: 'wechat_channels', contentId: '14941130915890399732', cursor: 'next' });

  assert.deepEqual(JSON.parse(requests[0].options.body), { username: 'gh_example', page_size: 10, offset: 'next', raw: true });
  assert.deepEqual(JSON.parse(requests[1].options.body), { username: 'v2_abcdef@finder', last_buffer: 'next', raw: true });
  assert.deepEqual(JSON.parse(requests[2].options.body), { url: 'https://mp.weixin.qq.com/s/example', buffer: 'next', raw: true });
  assert.deepEqual(JSON.parse(requests[3].options.body), { object_id: '14941130915890399732', last_buffer: 'next', raw: true });
});

test('TikHubClient uses documented GET creator and comment contracts for Douyin', async () => {
  const requests = [];
  const client = new TikHubClient({
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), options });
      return jsonResponse({ code: 200, data: {} });
    },
  });

  await client.getCreatorContents({ platform: 'douyin', creatorId: 'sec-user', cursor: '20', limit: 10 });
  await client.getComments({ platform: 'douyin', contentId: 'aweme-001', cursor: '20' });

  assert.match(requests[0].url, /fetch_user_post_videos\?sec_user_id=sec-user&max_cursor=20&count=10&sort_type=0/);
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.body, undefined);
  assert.match(requests[1].url, /fetch_video_comments\?aweme_id=aweme-001&cursor=20&count=20/);
  assert.equal(requests[1].options.method, 'GET');
  assert.equal(requests[1].options.body, undefined);
});

test('TikHubClient sends zero as the initial Douyin cursor', async () => {
  const urls = [];
  const client = new TikHubClient({
    apiKey: 'test-key',
    fetchImpl: async (url) => {
      urls.push(String(url));
      return jsonResponse({ code: 200, data: {} });
    },
  });

  await client.getCreatorContents({ platform: 'douyin', creatorId: 'sec-user' });
  await client.getComments({ platform: 'douyin', contentId: 'aweme-001' });

  assert.match(urls[0], /max_cursor=0/);
  assert.match(urls[1], /cursor=0/);
});

test('TikHubClient rejects incomplete WeChat detail and comment identifiers', async () => {
  const client = new TikHubClient({ apiKey: 'test-key' });

  await assert.rejects(() => client.getContentDetail({ platform: 'wechat_mp' }), /requires an article shareUrl/);
  await assert.rejects(() => client.getContentDetail({ platform: 'wechat_channels', contentId: 'finder-object' }), /requires a shareUrl or numeric object_id/);
  await assert.rejects(() => client.getComments({ platform: 'wechat_mp', contentId: 'article' }), /require an article shareUrl/);
  await assert.rejects(() => client.getComments({ platform: 'wechat_channels', contentId: 'finder-object' }), /require a numeric object_id/);
});

test('TikHubClient uses documented POST search contracts for WeChat platforms', async () => {
  const requests = [];
  const client = new TikHubClient({
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), options });
      return jsonResponse({ code: 200, data: {} });
    },
  });

  await client.searchContents({ platform: 'wechat_mp', keyword: '企业 AI' });
  await client.searchContents({ platform: 'wechat_channels', keyword: '企业 AI' });

  assert.match(requests[0].url, /wechat_search\/v2\/fetch_search$/);
  assert.equal(requests[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].options.body), { keyword: '企业 AI', business_type: 'article', offset: 0, raw: true });
  assert.match(requests[1].url, /wechat_search\/v2\/fetch_search_videos$/);
  assert.equal(requests[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[1].options.body), { keyword: '企业 AI', offset: 0, raw: true });
});

test('TikHub response normalizers create stable content and comment records', () => {
  const content = normalizeTikHubContent({
    platform: 'douyin',
    data: {
      aweme_id: 'dy-001',
      desc: '企业 AI 先做一个真实流程。',
      author: { nickname: '企业 AI 顾问', sec_uid: 'sec-001' },
      statistics: { digg_count: 30, comment_count: 4, collect_count: 5, share_count: 2 },
      create_time: 1_784_041_200,
      share_url: 'https://www.douyin.com/video/dy-001',
    },
  });
  const comments = normalizeTikHubComments({
    platform: 'douyin',
    contentUniqueKey: content.uniqueKey,
    items: [{ cid: 'comment-001', text: '怎么评估是否值得先做？', user: { nickname: '提问者' }, create_time: 1_784_041_300, digg_count: 6 }],
  });

  assert.equal(content.uniqueKey, 'douyin:dy-001');
  assert.equal(content.creatorName, '企业 AI 顾问');
  assert.equal(content.metrics.commentCount, 4);
  assert.equal(comments[0].commentUniqueKey, 'douyin:douyin:dy-001:comment-001');
  assert.equal(comments[0].commentText, '怎么评估是否值得先做？');
});

test('TikHub contract fixtures normalize list envelopes from all four supported platforms', async () => {
  const fixtures = [
    ['xiaohongshu', 'xiaohongshu-search-page.json', 'xhs-contract-001', 'xhs-next-page'],
    ['douyin', 'douyin-search-page.json', 'dy-contract-001', '987654321'],
    ['wechat_mp', 'wechat-mp-account-page.json', 'mp-contract-001', 'mp-next-page'],
    ['wechat_channels', 'wechat-channels-creator-page.json', 'channels-contract-001', 'channels-next-page'],
  ];

  for (const [platform, fileName, contentId, cursor] of fixtures) {
    const fixture = await readFixture(fileName);
    const page = extractTikHubPage(fixture);
    const content = normalizeTikHubContent({ platform, data: page.items[0] });
    assert.equal(page.hasMore, true);
    assert.equal(page.cursor, cursor);
    assert.equal(content.contentExternalId, contentId);
  }
});

test('TikHub normalizers accept the real Xiaohongshu search envelope and note wrapper', async () => {
  const fixture = await readFixture('xiaohongshu-real-envelope-search.json');
  const page = extractTikHubPage(fixture);
  const content = normalizeTikHubContent({ platform: 'xiaohongshu', data: page.items[0] });

  assert.equal(page.items.length, 1);
  assert.equal(page.cursor, '2');
  assert.equal(page.hasMore, true);
  assert.equal(content.contentExternalId, 'xhs-real-envelope-001');
  assert.equal(content.creatorExternalId, 'creator-real-001');
  assert.equal(content.metrics.commentCount, 3);
});

test('TikHub normalizers accept the real Xiaohongshu detail and comment envelopes', () => {
  const detail = {
    data: [{
      note_list: [{
        id: 'xhs-detail-001',
        title: '企业 AI 先梳理流程',
        desc: '从真实任务开始。',
        user: { userid: 'xhs-creator-001', nickname: 'AI 实践者' },
        liked_count: 12,
        comments_count: 3,
        type: 'normal',
      }],
    }],
  };
  const comments = {
    data: {
      cursor: 'xhs-comment-next',
      has_more: true,
      comments: [{ id: 'xhs-comment-001', content: '如何判断先从哪个流程做？', user: { nickname: '提问者' }, time: 1_784_041_200 }],
    },
  };
  const content = normalizeTikHubContent({ platform: 'xiaohongshu', data: detail });
  const page = extractTikHubPage(comments);
  const normalizedComments = normalizeTikHubComments({ platform: 'xiaohongshu', contentUniqueKey: content.uniqueKey, items: page.items });

  assert.equal(content.contentExternalId, 'xhs-detail-001');
  assert.equal(content.creatorExternalId, 'xhs-creator-001');
  assert.equal(content.metrics.commentCount, 3);
  assert.equal(page.cursor, 'xhs-comment-next');
  assert.equal(page.hasMore, true);
  assert.equal(normalizedComments[0].commentText, '如何判断先从哪个流程做？');
});

test('TikHub page parser reads Xiaohongshu creator cursors from note items', () => {
  const page = extractTikHubPage({
    data: {
      has_more: true,
      notes: [{ id: 'xhs-creator-note-001', cursor: 'xhs-creator-next' }],
    },
  });

  assert.equal(page.items.length, 1);
  assert.equal(page.cursor, 'xhs-creator-next');
  assert.equal(page.hasMore, true);
});

test('TikHub normalizers accept the real Douyin card array and aweme wrapper', async () => {
  const fixture = await readFixture('douyin-real-envelope-search.json');
  const page = extractTikHubPage(fixture);
  const content = normalizeTikHubContent({ platform: 'douyin', data: page.items[0] });

  assert.equal(page.items.length, 1);
  assert.equal(page.cursor, '20');
  assert.equal(page.hasMore, true);
  assert.equal(content.contentExternalId, 'dy-real-envelope-001');
  assert.equal(content.creatorExternalId, 'douyin-real-creator-001');
  assert.equal(content.metrics.commentCount, 3);
});

test('TikHub normalizers flatten WeChat search result groups', () => {
  const page = extractTikHubPage({
    keyword: '企业 AI 工作流',
    results: {
      data: [{
        items: [{
          docID: 'wechat-search-001',
          title: '企业<em class="highlight">AI</em>工作流',
          desc: '从真实流程开始。',
          date: 1_784_041_200,
          doc_url: 'https://mp.weixin.qq.com/s/example',
          source: { title: '企业实践观察' },
        }],
      }],
    },
  });
  const content = normalizeTikHubContent({ platform: 'wechat_mp', data: page.items[0] });

  assert.equal(page.items.length, 1);
  assert.equal(content.contentExternalId, 'wechat-search-001');
  assert.equal(content.creatorName, '企业实践观察');
  assert.equal(content.title, '企业AI工作流');
  assert.equal(content.contentType, '文章');
});

test('TikHub normalizers flatten WeChat Channels search sub-boxes', () => {
  const page = extractTikHubPage({
    results: {
      continue_flag: 1,
      cursor: 'channels-next-page',
      data: [{
        subBoxes: [{
          items: [{
            docID: 'finder-object-001',
            title: '企业<em class="highlight">AI</em>工作流',
            pubTime: 1_784_041_200,
            likeNum: '28',
            source: { title: '视频号实践者' },
          }],
        }],
      }],
    },
  });
  const content = normalizeTikHubContent({ platform: 'wechat_channels', data: page.items[0] });

  assert.equal(page.items.length, 1);
  assert.equal(page.cursor, 'channels-next-page');
  assert.equal(page.hasMore, true);
  assert.equal(content.contentExternalId, 'finder-object-001');
  assert.equal(content.creatorName, '视频号实践者');
  assert.equal(content.title, '企业AI工作流');
  assert.equal(content.metrics.likeCount, 28);
});

test('TikHub content normalizer removes URL query parameters before storage', () => {
  const content = normalizeTikHubContent({
    platform: 'douyin',
    data: { aweme_id: 'dy-url-001', share_url: 'https://www.douyin.com/video/dy-url-001?token=secret&from=share' },
  });
  assert.equal(content.url, 'https://www.douyin.com/video/dy-url-001');
});

test('TikHub contract comment fixture exposes a next-page cursor', async () => {
  const page = extractTikHubPage(await readFixture('comments-page.json'));
  assert.equal(page.items.length, 1);
  assert.equal(page.cursor, 'comments-next-page');
  assert.equal(page.hasMore, true);
});

test('TikHub page parser leaves a missing cursor null', () => {
  const page = extractTikHubPage({ data: { items: [], has_more: false } });
  assert.equal(page.cursor, null);
  assert.equal(page.hasMore, false);
});

async function readFixture(fileName) {
  return JSON.parse(await readFile(fileURLToPath(new URL(`../fixtures/tikhub-contracts/${fileName}`, import.meta.url)), 'utf8'));
}

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    async json() {
      return body;
    },
  };
}
