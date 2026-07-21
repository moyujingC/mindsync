import test from 'node:test';
import assert from 'node:assert/strict';
import { TikHubClient } from '../src/platforms/tikhub/client.mjs';
import { normalizeTikHubComments, normalizeTikHubContent } from '../src/platforms/tikhub/normalize.mjs';

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
  const urls = [];
  const client = new TikHubClient({
    apiKey: 'test-key',
    fetchImpl: async (url) => {
      urls.push(String(url));
      return jsonResponse({ code: 200, data: {} });
    },
  });

  await client.getContentDetail({ platform: 'douyin', shareUrl: 'https://v.douyin.com/example' });
  await client.getContentDetail({ platform: 'wechat_mp', shareUrl: 'https://mp.weixin.qq.com/s/example' });
  await client.getContentDetail({ platform: 'wechat_channels', shareUrl: 'https://weixin.qq.com/sph/example' });

  assert.match(urls[0], /share_url=/);
  assert.match(urls[1], /url=/);
  assert.match(urls[2], /share_url=/);
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

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    async json() {
      return body;
    },
  };
}
