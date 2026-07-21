import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildWeeklyReview } from '../src/jobs/weekly-review.mjs';

test('buildWeeklyReview aggregates one week of reports and artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-weekly-review-'));
  const runsDir = join(dir, 'runs');
  const topicDir = join(dir, 'topic-candidates');
  const accountsRoot = join(dir, 'accounts');
  const feedbackRoot = join(accountsRoot, '墨予镜', 'feedback');
  const outputPath = join(dir, 'weekly-reviews', '2026-07-15.md');

  await mkdir(join(runsDir, '2026-07-14'), { recursive: true });
  await mkdir(join(runsDir, '2026-07-15'), { recursive: true });
  await mkdir(topicDir, { recursive: true });
  await mkdir(join(accountsRoot, '墨予镜'), { recursive: true });
  await mkdir(feedbackRoot, { recursive: true });

  await writeFile(join(runsDir, '2026-07-14', 'run.json'), JSON.stringify({
    generatedAt: '2026-07-14T10:00:00.000Z',
    summary: {
      startedAt: '2026-07-14T10:00:00.000Z',
      createdCount: 2,
      duplicateCount: 0,
      failedCount: 1,
    },
    creators: [{
      creatorId: 'rec_fail',
      creatorName: '失败账号',
      platform: 'bilibili',
      failed: true,
      error: 'rss failed',
    }],
  }), 'utf8');

  await writeFile(join(runsDir, '2026-07-15', 'run.json'), JSON.stringify({
    generatedAt: '2026-07-15T10:00:00.000Z',
    summary: {
      startedAt: '2026-07-15T10:00:00.000Z',
      createdCount: 3,
      duplicateCount: 1,
      failedCount: 0,
    },
    creators: [],
  }), 'utf8');

  await writeFile(join(topicDir, '2026-07-15T11-00-00-000Z.json'), JSON.stringify({
    generatedAt: '2026-07-15T11:00:00.000Z',
    count: 4,
  }), 'utf8');

  await writeFile(join(accountsRoot, '墨予镜', '2026-07-15-样例-草稿.md'), '# 草稿\n', 'utf8');
  await writeFile(join(accountsRoot, '墨予镜', '2026-07-15-样例-成稿.md'), '# 成稿\n', 'utf8');
  await writeFile(join(feedbackRoot, '2026-07-15-样例-发布反馈.md'), '# 样例 发布反馈记录\n\n- 是否进入样本沟通：是 / 否\n', 'utf8');

  try {
    const result = await buildWeeklyReview({
      startDate: '2026-07-09',
      endDate: '2026-07-15',
      runsDir,
      topicDir,
      accountsRoot,
      feedbackRoot,
      outputPath,
    });

    assert.equal(result.summary.runCount, 2);
    assert.equal(result.summary.createdContentCount, 5);
    assert.equal(result.summary.topicCandidateCount, 4);
    assert.equal(result.summary.draftCount, 1);
    assert.equal(result.summary.finalDraftCount, 1);
    assert.equal(result.summary.feedbackCount, 1);

    const markdown = await readFile(outputPath, 'utf8');
    assert.match(markdown, /# 历史运行汇总（2026-07-09 ~ 2026-07-15）/);
    assert.match(markdown, /新增内容数：5/);
    assert.match(markdown, /失败账号 \| rss failed/);
    assert.match(markdown, /发布反馈记录数：1/);
    assert.match(markdown, /不生成下一轮研究请求、选题或服务决策/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
