import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadLatestBilibili } from '../src/jobs/download-bilibili.mjs';

test('downloadLatestBilibili writes artifact directory with metadata and description', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-download-bili-'));
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url) => {
    if (String(url).includes('/bilibili/user/video/')) {
      return new Response(`
        <rss><channel>
          <item>
            <title>测试视频</title>
            <link>https://www.bilibili.com/video/BV1abc123456</link>
            <guid>https://www.bilibili.com/video/BV1abc123456</guid>
            <pubDate>Wed, 15 Jul 2026 01:00:00 GMT</pubDate>
            <description><![CDATA[<p>视频简介</p>]]></description>
          </item>
        </channel></rss>
      `, { status: 200 });
    }
    return new Response('fake-video', { status: 200 });
  };

  try {
    const result = await downloadLatestBilibili({
      creator: {
        id: 'sample-bilibili-rss',
        name: 'B站样例账号',
        platform: 'bilibili',
        externalId: '2',
        source: {
          kind: 'rss',
          url: 'https://rsshub.app/bilibili/user/video/2',
        },
      },
      outputRoot: dir,
      limit: 1,
      cwd: dir,
      downloader: async ({ outputDir }) => join(outputDir, 'video.mp4'),
    });

    assert.equal(result.count, 1);
    const artifact = result.results[0].artifact;
    const metadata = JSON.parse(await readFile(artifact.metadataPath, 'utf8'));
    const description = await readFile(artifact.descriptionPath, 'utf8');
    const manifest = JSON.parse(await readFile(join(artifact.artifactDir, 'download-manifest.json'), 'utf8'));

    assert.equal(metadata.contentExternalId, 'BV1abc123456');
    assert.equal(description, '视频简介');
    assert.equal(manifest.downloadStatus, 'downloaded');
  } finally {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  }
});

test('downloadLatestBilibili keeps metadata-only mode when downloader is disabled', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-download-bili-meta-'));
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url) => {
    if (String(url).includes('/bilibili/user/video/')) {
      return new Response(`
        <rss><channel>
          <item>
            <title>测试视频</title>
            <link>https://www.bilibili.com/video/BV1abc123456</link>
            <guid>https://www.bilibili.com/video/BV1abc123456</guid>
            <pubDate>Wed, 15 Jul 2026 01:00:00 GMT</pubDate>
            <description><![CDATA[<p>视频简介</p>]]></description>
          </item>
        </channel></rss>
      `, { status: 200 });
    }
    return new Response('unexpected', { status: 500 });
  };

  try {
    const result = await downloadLatestBilibili({
      creator: {
        id: 'sample-bilibili-rss',
        name: 'B站样例账号',
        platform: 'bilibili',
        externalId: '2',
        source: {
          kind: 'rss',
          url: 'https://rsshub.app/bilibili/user/video/2',
        },
      },
      outputRoot: dir,
      limit: 1,
      cwd: dir,
      downloadMode: 'metadata-only',
    });

    const artifact = result.results[0].artifact;
    const manifest = JSON.parse(await readFile(join(artifact.artifactDir, 'download-manifest.json'), 'utf8'));

    assert.equal(manifest.downloadStatus, 'metadata-only');
    assert.equal(manifest.videoPath, null);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  }
});
