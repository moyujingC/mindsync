import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importManualContents, normalizeManualInput } from '../src/jobs/manual-import.mjs';

test('normalizeManualInput creates stable content keys for manual items', () => {
  const contents = normalizeManualInput({
    items: [{
      platform: '小红书',
      creatorName: '样例账号',
      externalId: 'note-1',
      url: 'https://www.xiaohongshu.com/explore/note-1',
      title: '样例标题',
      description: '样例正文',
      likeCount: '12',
    }],
  });

  assert.equal(contents.length, 1);
  assert.equal(contents[0].uniqueKey, '小红书:note-1');
  assert.equal(contents[0].contentExternalId, 'note-1');
  assert.equal(contents[0].metrics.likeCount, 12);
  assert.equal(contents[0].tags, undefined);
});

test('importManualContents dry-run does not persist store', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-manual-dry-'));
  const inputPath = join(dir, 'input.json');
  const storePath = join(dir, 'store.json');
  await writeFile(inputPath, JSON.stringify({
    items: [manualItem('小红书', 'note-1')],
  }), 'utf8');

  try {
    const first = await importManualContents({
      inputPath,
      storePath,
      dryRun: true,
    });
    const second = await importManualContents({
      inputPath,
      storePath,
      dryRun: true,
    });

    assert.equal(first.createdCount, 1);
    assert.equal(second.createdCount, 1);
    await assert.rejects(readFile(storePath, 'utf8'), /ENOENT/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('importManualContents writes new records and deduplicates local store', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-manual-write-'));
  const inputPath = join(dir, 'input.json');
  const storePath = join(dir, 'store.json');
  await writeFile(inputPath, JSON.stringify({
    items: [manualItem('抖音', 'video-1')],
  }), 'utf8');

  try {
    const first = await importManualContents({
      inputPath,
      storePath,
      dryRun: false,
    });
    const second = await importManualContents({
      inputPath,
      storePath,
      dryRun: false,
    });

    assert.equal(first.createdCount, 1);
    assert.equal(first.duplicateCount, 0);
    assert.equal(second.createdCount, 0);
    assert.equal(second.duplicateCount, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function manualItem(platform, externalId) {
  return {
    platform,
    creatorName: `${platform}样例账号`,
    externalId,
    url: `https://example.com/${externalId}`,
    title: `${platform}样例标题`,
    description: '样例正文',
    publishedAt: '2026-07-15T09:00:00.000Z',
  };
}
