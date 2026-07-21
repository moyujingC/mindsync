import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureTikHubContract, sanitizeTikHubResponse } from '../src/jobs/capture-tikhub-contract.mjs';
import { TikHubClient } from '../src/platforms/tikhub/client.mjs';

test('captureTikHubContract saves a redacted dry-run response without Feishu writes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tikhub-contract-capture-'));
  try {
    const client = new TikHubClient({
      apiKey: 'secret-api-key',
      fetchImpl: async () => jsonResponse({
        code: 200,
        cache_url: 'https://cache.example/record?signature=secret',
        data: {
          note_id: 'note-001',
          title: '标题可保留',
          desc: '不得写入合同样本的正文',
          share_url: 'https://www.xiaohongshu.com/explore/note-001?token=secret',
          xsec_token: 'sensitive-token',
          user: { user_id: 'user-001', userid: 'user-legacy-001', nickname: '用户甲', avatar: 'https://avatar.example/a.png' },
          comments: [{ id: 'comment-001', text: '不得写入的评论', user: { uid: 'commenter-001' } }],
        },
      }),
    });
    const result = await captureTikHubContract({
      request: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://www.xiaohongshu.com/explore/note-001' },
      client,
      outputDir: dir,
    });

    assert.equal(result.status, 'ok');
    assert.equal(result.responseCount, 1);
    assert.equal(result.collection.contentCount, 1);
    assert.match(result.files[0], /get_image_note_detail\.json$/);
    const files = await readdir(dir);
    assert.equal(files.some((file) => file === '.capture-store.json'), false);
    const captured = JSON.parse(await readFile(result.files[0], 'utf8'));
    assert.equal(captured.request.params.share_text, 'https://www.xiaohongshu.com/explore/note-001');
    assert.equal(captured.response.body.data.note_id, '[redacted-note_id]');
    assert.equal(captured.response.body.data.desc, '[redacted-desc]');
    assert.equal(captured.response.body.data.user.user_id, '[redacted-user_id]');
    assert.equal(captured.response.body.data.user.userid, '[redacted-userid]');
    assert.equal(captured.response.body.data.user.nickname, '[redacted-nickname]');
    assert.equal(captured.response.body.data.xsec_token, '[redacted-xsec_token]');
    assert.equal(captured.response.body.data.share_url, 'https://www.xiaohongshu.com/explore/note-001');
    assert.equal(captured.response.body.data.comments[0].text, '[redacted-text]');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('captureTikHubContract captures a standalone comment page by content ID', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tikhub-comment-contract-'));
  try {
    const client = new TikHubClient({
      apiKey: 'secret-api-key',
      fetchImpl: async () => jsonResponse({
        code: 200,
        data: { commentInfo: [{ id: 42, content: '私密评论', nick_name: '用户甲' }], last_buffer: 'next' },
      }),
    });
    const result = await captureTikHubContract({
      request: { mode: 'comments', platform: 'wechat_channels', contentId: '14529719893133756529' },
      client,
      outputDir: dir,
    });

    assert.equal(result.collection.commentCount, 1);
    assert.deepEqual(result.collection.pagination, {
      comments: { itemCount: 1, hasMore: false, cursorPresent: true },
    });
    assert.match(result.files[0], /fetch_video_comments\.json$/);
    const captured = JSON.parse(await readFile(result.files[0], 'utf8'));
    assert.equal(captured.request.body.object_id, '[redacted-object_id]');
    assert.equal(captured.response.body.data.commentInfo[0].content, '[redacted-content]');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('sanitizeTikHubResponse redacts credentials, identifiers, text, and URL query strings', () => {
  const sanitized = sanitizeTikHubResponse({
    path: '/api/v1/example',
    method: 'POST',
    params: { token: 'secret', keyword: '企业 AI' },
    body: { creator_id: 'creator-001', export_id: 'short-lived-export-id', content: 'private text' },
    status: 200,
    response: { code: 200, data: { url: 'https://example.com/a?secret=1', uid: 'user-001', message: 'reply text' } },
  });

  assert.equal(sanitized.request.params.token, '[redacted-token]');
  assert.equal(sanitized.request.body.export_id, '[redacted-export_id]');
  assert.equal(sanitized.request.body.content, '[redacted-content]');
  assert.equal(sanitized.response.body.data.uid, '[redacted-uid]');
  assert.equal(sanitized.response.body.data.message, '[redacted-message]');
  assert.equal(sanitized.response.body.data.url, 'https://example.com/a');
});

test('sanitizeTikHubResponse bounds nested payloads and redacts generic identifiers', () => {
  const sanitized = sanitizeTikHubResponse({
    path: '/api/v1/example',
    method: 'GET',
    params: null,
    body: null,
    status: 200,
    response: {
      code: 200,
      data: [{ id: 'platform-id', title: 'private title', nested: { one: { two: { three: { four: { five: 'payload' } } } } } }, { id: 'not-retained' }],
    },
  });

  assert.equal(sanitized.response.body.data.length, 1);
  assert.equal(sanitized.response.body.data[0].id, '[redacted-id]');
  assert.equal(sanitized.response.body.data[0].title, '[redacted-title]');
  assert.equal(sanitized.response.body.data[0].nested.one.two.three.four.five, '[omitted-value]');
});

test('sanitizeTikHubResponse keeps structural fields from wide payloads', () => {
  const response = { code: 200, data: { aweme_list: [{ aweme_id: 'video-001' }], has_more: 1, cursor: 20 } };
  for (let index = 0; index < 30; index += 1) {
    response.data[`noise_${index}`] = index;
  }
  const sanitized = sanitizeTikHubResponse({ path: '/api/v1/example', method: 'GET', params: null, body: null, status: 200, response });

  assert.deepEqual(Object.keys(sanitized.response.body.data).sort(), ['aweme_list', 'cursor', 'has_more']);
  assert.equal(sanitized.response.body.data.aweme_list[0].aweme_id, '[redacted-aweme_id]');
});

test('sanitizeTikHubResponse redacts compact social-profile identifiers', () => {
  const sanitized = sanitizeTikHubResponse({
    path: '/api/v1/example',
    method: 'GET',
    params: null,
    body: null,
    status: 200,
    response: { code: 200, data: { user: { short_id: '123', unique_id: 'handle', avatar_thumb: { uri: 'avatar-id' } } } },
  });

  assert.equal(sanitized.response.body.data.user.short_id, '[redacted-short_id]');
  assert.equal(sanitized.response.body.data.user.unique_id, '[redacted-unique_id]');
  assert.equal(sanitized.response.body.data.user.avatar_thumb, '[redacted-avatar_thumb]');
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
