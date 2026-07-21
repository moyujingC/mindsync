import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildRunReport, writeRunReport } from '../src/utils/report.mjs';

test('buildRunReport creates auditable summary', () => {
  const report = buildRunReport({
    dryRun: true,
    startedAt: '2026-07-15T01:00:00.000Z',
    finishedAt: '2026-07-15T01:00:01.000Z',
    creatorCount: 1,
    createdCount: 1,
    duplicateCount: 0,
    failedCount: 0,
    creatorResults: [{
      creatorId: 'creator-1',
      creatorName: '测试账号',
      platform: 'douyin',
      fetchedCount: 1,
      createdCount: 1,
      duplicateCount: 0,
      failed: false,
      error: null,
      contents: [{
        uniqueKey: 'douyin:dy-001',
        title: '标题',
        url: 'https://www.douyin.com/video/dy-001',
        publishedAt: '2026-07-15T00:00:00.000Z',
      }],
    }],
  }, {
    mode: 'daily',
  });

  assert.equal(report.schema, 'content-matrix/influencer-tracker-run/v1');
  assert.equal(report.meta.mode, 'daily');
  assert.equal(report.summary.createdCount, 1);
  assert.equal(report.creators[0].newContents[0].uniqueKey, 'douyin:dy-001');
});

test('writeRunReport writes date-partitioned JSON report', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-report-'));
  try {
    const { filePath, report } = await writeRunReport({
      reportDir: dir,
      meta: { mode: 'daily' },
      result: {
        dryRun: true,
        startedAt: '2026-07-15T01:00:00.000Z',
        finishedAt: '2026-07-15T01:00:01.000Z',
        creatorCount: 0,
        createdCount: 0,
        duplicateCount: 0,
        failedCount: 0,
        creatorResults: [],
      },
    });

    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    assert.equal(parsed.schema, report.schema);
    assert.match(filePath, /\/\d{4}-\d{2}-\d{2}\//);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
