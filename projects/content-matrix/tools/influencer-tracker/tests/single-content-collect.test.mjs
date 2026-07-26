import test from 'node:test';
import assert from 'node:assert/strict';
import { collectSingleContent } from '../src/jobs/single-content-collect.mjs';

test('single link collects metadata and content without sampling comments by default', async () => {
  const calls = [];
  const result = await collectSingleContent({
    platform: 'douyin', shareUrl: 'https://example.test/video/1', storePath: '/tmp/single-content-test.json', outputDir: '/tmp',
    client: {
      async getContentDetail() { calls.push('detail'); return { data: { aweme_id: '1', desc: '正文', author: { nickname: '作者' } }, audit: { requestCount: 1 } }; },
      async getComments() { calls.push('comments'); throw new Error('must not request'); },
    },
    enrichVideo: async ({ collection }) => ({ ...collection, media: { videoCount: 0, completedCount: 0, failedCount: 0, items: [] } }),
  });
  assert.deepEqual(calls, ['detail']);
  assert.equal(result.layers.basicInfo.status, '已完成');
  assert.equal(result.layers.content.status, '已完成');
  assert.equal(result.layers.comments.status, '未请求');
});

test('single link samples comments only when explicitly requested', async () => {
  const calls = [];
  const result = await collectSingleContent({
    platform: 'douyin', shareUrl: 'https://example.test/video/2', storePath: '/tmp/single-content-comments-test.json', outputDir: '/tmp', includeComments: true,
    client: {
      async getContentDetail() { calls.push('detail'); return { data: { aweme_id: '2', desc: '正文', author: { nickname: '作者' } }, audit: { requestCount: 1 } }; },
      async getComments() { calls.push('comments'); return { data: { comments: [{ cid: 'c-1', text: '评论' }] }, audit: { requestCount: 1 } }; },
    },
    enrichVideo: async ({ collection }) => ({ ...collection, media: { videoCount: 0, completedCount: 0, failedCount: 0, items: [] } }),
  });
  assert.deepEqual(calls, ['detail', 'comments']);
  assert.equal(result.layers.comments.status, '已完成');
  assert.equal(result.layers.comments.count, 1);
});
