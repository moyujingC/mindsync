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
          user: { user_id: 'user-001', nickname: '用户甲', avatar: 'https://avatar.example/a.png' },
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
    const files = await readdir(dir);
    assert.equal(files.some((file) => file === '.capture-store.json'), false);
    const captured = JSON.parse(await readFile(result.files[0], 'utf8'));
    assert.equal(captured.request.params.share_text, 'https://www.xiaohongshu.com/explore/note-001');
    assert.equal(captured.response.body.data.desc, '[redacted-desc]');
    assert.equal(captured.response.body.data.user.user_id, '[redacted-user_id]');
    assert.equal(captured.response.body.data.user.nickname, '[redacted-nickname]');
    assert.equal(captured.response.body.data.share_url, 'https://www.xiaohongshu.com/explore/note-001');
    assert.equal(captured.response.body.data.comments[0].text, '[redacted-text]');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('sanitizeTikHubResponse redacts credentials, identifiers, text, and URL query strings', () => {
  const sanitized = sanitizeTikHubResponse({
    path: '/api/v1/example',
    method: 'POST',
    params: { token: 'secret', keyword: '企业 AI' },
    body: { creator_id: 'creator-001', content: 'private text' },
    status: 200,
    response: { code: 200, data: { url: 'https://example.com/a?secret=1', uid: 'user-001', message: 'reply text' } },
  });

  assert.equal(sanitized.request.params.token, '[redacted-token]');
  assert.equal(sanitized.request.body.content, '[redacted-content]');
  assert.equal(sanitized.response.body.data.uid, '[redacted-uid]');
  assert.equal(sanitized.response.body.data.message, '[redacted-message]');
  assert.equal(sanitized.response.body.data.url, 'https://example.com/a');
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
