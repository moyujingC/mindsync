import test from 'node:test';
import assert from 'node:assert/strict';
import { contentKeyAliases, normalizePlatformId, platformLabel } from '../src/platforms/platform-id.mjs';

test('platform contract normalizes Chinese labels to TikHub platform IDs', () => {
  assert.equal(normalizePlatformId('小红书'), 'xiaohongshu');
  assert.equal(normalizePlatformId('抖音'), 'douyin');
  assert.equal(normalizePlatformId('公众号'), 'wechat_mp');
  assert.equal(normalizePlatformId('视频号'), 'wechat_channels');
  assert.equal(platformLabel('wechat_mp'), '公众号');
});

test('platform contract rejects unsupported platforms and exposes legacy content key aliases', () => {
  assert.throws(() => normalizePlatformId('B站'), /Unsupported/);
  assert.deepEqual(
    contentKeyAliases({ platform: '小红书', externalId: 'note-1' }),
    new Set(['xiaohongshu:note-1', '小红书:note-1']),
  );
});
