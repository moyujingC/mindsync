import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateFixture, validateTikHubContractFixtures } from '../src/jobs/validate-tikhub-contracts.mjs';

test('validateTikHubContractFixtures accepts complete redacted coverage for one platform', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tikhub-contract-validation-'));
  try {
    await Promise.all([
      writeFixture(dir, 'xiaohongshu-01-get_image_note_detail.json', '/api/v1/xiaohongshu/get_image_note_detail'),
      writeFixture(dir, 'xiaohongshu-02-search_notes.json', '/api/v1/xiaohongshu/search_notes'),
      writeFixture(dir, 'xiaohongshu-03-get_user_posted_notes.json', '/api/v1/xiaohongshu/get_user_posted_notes'),
      writeFixture(dir, 'xiaohongshu-04-get_note_comments.json', '/api/v1/xiaohongshu/get_note_comments'),
    ]);
    const result = await validateTikHubContractFixtures({ fixtureDir: dir, platforms: ['xiaohongshu'] });

    assert.equal(result.ok, true);
    assert.deepEqual(result.coverage.xiaohongshu.missingKinds, []);
    assert.equal(result.scannedFileCount, 4);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('validateTikHubContractFixtures reports missing response kinds and unsafe captured values', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tikhub-contract-validation-'));
  try {
    await writeFixture(dir, 'douyin-01-fetch_one_video_by_share_url.json', '/api/v1/douyin/fetch_one_video_by_share_url', {
      data: { user_id: 'raw-user-id', url: 'https://example.com/video?token=leaked' },
    });
    const result = await validateTikHubContractFixtures({ fixtureDir: dir, platforms: ['douyin'] });

    assert.equal(result.ok, false);
    assert.deepEqual(result.coverage.douyin.missingKinds, ['detail', 'search', 'creator', 'comments']);
    assert.match(result.invalidFiles[0].errors.join('\n'), /Unsafe values remain/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('validateFixture rejects a non-capture document and failed API response', () => {
  const result = validateFixture({
    filePath: '/tmp/xiaohongshu-01-detail.json',
    fixture: { schema: 'wrong', request: {}, response: { status: 402, body: { code: 402 } } },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Unexpected capture schema/);
  assert.match(result.errors.join('\n'), /Response status/);
});

async function writeFixture(dir, name, path, body = { data: { note_id: '[redacted-note_id]', user_id: '[redacted-user_id]' } }) {
  const fixture = {
    schema: 'content-matrix/tikhub-contract-capture/v1',
    capturedAt: '2026-07-21T00:00:00.000Z',
    request: { path, method: 'GET', params: {}, body: null },
    response: { status: 200, body: { code: 200, ...body } },
  };
  await writeFile(join(dir, name), `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
}
