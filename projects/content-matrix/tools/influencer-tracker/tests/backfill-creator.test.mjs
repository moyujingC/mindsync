import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { backfillCreator, selectCreator } from '../src/jobs/backfill-creator.mjs';

test('selectCreator matches by id or name', () => {
  const creators = [
    { id: 'a', name: '账号A' },
    { id: 'b', name: '账号B' },
  ];

  assert.equal(selectCreator({ creators, creatorId: 'a' }).name, '账号A');
  assert.equal(selectCreator({ creators, creatorName: '账号B' }).id, 'b');
});

test('backfillCreator filters by since and deduplicates store', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-backfill-'));
  const storePath = join(dir, 'store.json');

  const creators = [{
    id: 'sample',
    name: '样例账号',
    platform: 'bilibili',
    externalId: '2',
    source: {
      kind: 'rss-file',
      path: 'fixtures/bilibili-rss.example.xml',
    },
  }];

  try {
    const first = await backfillCreator({
      creators,
      creatorId: 'sample',
      storePath,
      dryRun: false,
      limit: 20,
      since: '2026-07-15T01:30:00.000Z',
      cwd: '/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker',
    });

    assert.equal(first.fetchedCount, 2);
    assert.equal(first.candidateCount, 1);
    assert.equal(first.createdCount, 1);

    const second = await backfillCreator({
      creators,
      creatorId: 'sample',
      storePath,
      dryRun: false,
      limit: 20,
      since: '2026-07-15T01:30:00.000Z',
      cwd: '/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker',
    });

    assert.equal(second.createdCount, 0);
    assert.equal(second.duplicateCount, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('backfillCreator respects limit in dry-run mode', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-backfill-limit-'));
  const storePath = join(dir, 'store.json');

  const creators = [{
    id: 'sample',
    name: '样例账号',
    platform: 'bilibili',
    externalId: '2',
    source: {
      kind: 'rss-file',
      path: 'fixtures/bilibili-rss.example.xml',
    },
  }];

  try {
    const result = await backfillCreator({
      creators,
      creatorName: '样例账号',
      storePath,
      dryRun: true,
      limit: 1,
      cwd: '/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker',
    });

    assert.equal(result.candidateCount, 1);
    assert.equal(result.createdCount, 1);
    assert.equal(result.dryRun, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
