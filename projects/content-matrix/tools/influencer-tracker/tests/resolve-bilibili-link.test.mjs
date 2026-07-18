import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyBilibiliUrl,
  extractBilibiliUid,
  extractUrlFromText,
  extractBilibiliVideoId,
  normalizeBilibiliUid,
  resolveBilibiliLink,
} from '../src/jobs/resolve-bilibili-link.mjs';

test('resolveBilibiliLink recognizes Bilibili creator homepage after redirect', async () => {
  const result = await resolveBilibiliLink('https://b23.tv/creator-short', {
    fetchImpl: async () => ({
      url: 'https://space.bilibili.com/123456789?spm_id_from=333.999',
    }),
  });

  assert.equal(result.kind, 'creator');
  assert.equal(result.externalId, '123456789');
  assert.equal(result.homepageUrl, 'https://space.bilibili.com/123456789');
  assert.equal(result.sourceKind, 'rss');
  assert.equal(result.sourcePath, 'https://rsshub.app/bilibili/user/video/123456789');
});

test('resolveBilibiliLink recognizes Bilibili video as reference content', async () => {
  const result = await resolveBilibiliLink('https://b23.tv/video-short', {
    fetchImpl: async () => ({
      url: 'https://www.bilibili.com/video/BV1abcDEF12?share_source=copy_web',
    }),
  });

  assert.equal(result.kind, 'content');
  assert.equal(result.externalId, 'BV1abcDEF12');
  assert.equal(result.content.platform, 'bilibili');
  assert.equal(result.content.creatorName, '随机发现');
  assert.equal(result.content.externalId, 'BV1abcDEF12');
});

test('Bilibili URL helpers classify and extract stable ids', () => {
  assert.equal(classifyBilibiliUrl('https://space.bilibili.com/42'), 'creator');
  assert.equal(classifyBilibiliUrl('https://www.bilibili.com/video/BV1xx411c7mD'), 'content');
  assert.equal(extractBilibiliUid('https://space.bilibili.com/42'), '42');
  assert.equal(extractBilibiliVideoId('https://www.bilibili.com/video/av12345'), 'av12345');
});

test('extractUrlFromText accepts Markdown and pasted text around short links', () => {
  assert.equal(
    extractUrlFromText('[https://b23.tv/IEv5taj](https://b23.tv/IEv5taj)'),
    'https://b23.tv/IEv5taj',
  );
  assert.equal(
    extractUrlFromText('主页：https://b23.tv/IEv5taj，来自飞书'),
    'https://b23.tv/IEv5taj',
  );
});

test('normalizeBilibiliUid accepts manually typed UID prefix', () => {
  assert.equal(normalizeBilibiliUid('UID:3546830396721763'), '3546830396721763');
  assert.equal(normalizeBilibiliUid('UID：3546830396721763'), '3546830396721763');
  assert.equal(normalizeBilibiliUid('3546830396721763'), '3546830396721763');
});
