import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDailySummary } from '../src/jobs/daily-summary.mjs';

test('buildDailySummary aggregates runs, topic batches and account artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-daily-summary-'));
  const runsDir = join(dir, 'runs', '2026-07-15');
  const topicDir = join(dir, 'topic-candidates');
  const accountsRoot = join(dir, 'accounts');
  const outputPath = join(dir, 'daily-summaries', '2026-07-15.md');

  await mkdir(runsDir, { recursive: true });
  await mkdir(topicDir, { recursive: true });
  await mkdir(join(accountsRoot, '墨予镜'), { recursive: true });

  await writeFile(join(runsDir, 'run.json'), JSON.stringify({
    generatedAt: '2026-07-15T10:00:00.000Z',
    summary: {
      startedAt: '2026-07-15T10:00:00.000Z',
      createdCount: 2,
      duplicateCount: 1,
      failedCount: 1,
    },
    creators: [{
      creatorName: '失败账号',
      failed: true,
      error: 'rss failed',
    }],
  }), 'utf8');

  await writeFile(join(topicDir, '2026-07-15T11-00-00-000Z.json'), JSON.stringify({
    generatedAt: '2026-07-15T11:00:00.000Z',
    count: 3,
  }), 'utf8');

  await writeFile(join(accountsRoot, '墨予镜', '2026-07-15-样例-草稿.md'), '# 草稿\n', 'utf8');
  await writeFile(join(accountsRoot, '墨予镜', '2026-07-15-样例-成稿.md'), '# 成稿\n', 'utf8');

  try {
    const result = await buildDailySummary({
      date: '2026-07-15',
      runsDir: join(dir, 'runs'),
      topicDir,
      accountsRoot,
      outputPath,
    });

    assert.equal(result.summary.runCount, 1);
    assert.equal(result.summary.createdContentCount, 2);
    assert.equal(result.summary.topicCandidateCount, 3);
    assert.equal(result.summary.draftCount, 1);
    assert.equal(result.summary.finalDraftCount, 1);

    const markdown = await readFile(outputPath, 'utf8');
    assert.match(markdown, /# AI 营销获客系统每日摘要（2026-07-15）/);
    assert.match(markdown, /新增内容数：2/);
    assert.match(markdown, /失败账号 \| rss failed/);
    assert.match(markdown, /墨予镜 \/ 2026-07-15-样例-草稿.md/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
