import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildFailureReview } from '../src/jobs/failure-review.mjs';

test('buildFailureReview flags creators with consecutive failures', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-failure-review-'));
  const runsDir = join(dir, 'runs');
  const outputPath = join(dir, 'failure-reviews', '2026-07-15.md');

  await mkdir(join(runsDir, '2026-07-13'), { recursive: true });
  await mkdir(join(runsDir, '2026-07-14'), { recursive: true });
  await mkdir(join(runsDir, '2026-07-15'), { recursive: true });

  await writeFile(join(runsDir, '2026-07-13', 'run.json'), JSON.stringify({
    generatedAt: '2026-07-13T10:00:00.000Z',
    creators: [{
      creatorId: 'rec_fail',
      creatorName: '失败账号',
      platform: 'douyin',
      failed: true,
      error: 'tikhub failed 1',
    }],
  }), 'utf8');

  await writeFile(join(runsDir, '2026-07-14', 'run.json'), JSON.stringify({
    generatedAt: '2026-07-14T10:00:00.000Z',
    creators: [{
      creatorId: 'rec_fail',
      creatorName: '失败账号',
      platform: 'douyin',
      failed: true,
      error: 'tikhub failed 2',
    }],
  }), 'utf8');

  await writeFile(join(runsDir, '2026-07-15', 'run.json'), JSON.stringify({
    generatedAt: '2026-07-15T10:00:00.000Z',
    creators: [{
      creatorId: 'rec_fail',
      creatorName: '失败账号',
      platform: 'douyin',
      failed: true,
      error: 'tikhub failed 3',
    }],
  }), 'utf8');

  try {
    const result = await buildFailureReview({
      date: '2026-07-15',
      lookbackDays: 3,
      threshold: 3,
      runsDir,
      outputPath,
    });

    assert.equal(result.summary.flaggedCount, 1);
    assert.equal(result.summary.flaggedCreators[0].consecutiveFailures, 3);

    const markdown = await readFile(outputPath, 'utf8');
    assert.match(markdown, /待人工处理账号数：1/);
    assert.match(markdown, /失败账号 \| 平台 douyin \| 连续失败 3 次/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('buildFailureReview can write back manual-review status to Feishu client', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-failure-review-feishu-'));
  const runsDir = join(dir, 'runs');
  const outputPath = join(dir, 'failure-reviews', '2026-07-15.md');

  await mkdir(join(runsDir, '2026-07-15'), { recursive: true });
  await writeFile(join(runsDir, '2026-07-15', 'run.json'), JSON.stringify({
    generatedAt: '2026-07-15T10:00:00.000Z',
    creators: [{
      creatorId: 'rec_fail',
      creatorName: '失败账号',
      platform: 'douyin',
      failed: true,
      error: 'tikhub failed',
    }],
  }), 'utf8');

  const updates = [];
  const feishuClient = {
    async updateRecord(tableName, recordId, fields) {
      updates.push({ tableName, recordId, fields });
    },
  };

  try {
    const result = await buildFailureReview({
      date: '2026-07-15',
      lookbackDays: 1,
      threshold: 1,
      runsDir,
      outputPath,
      feishuClient,
      feishuConfig: {
        tables: {
          creators: {
            fields: {
              enabledStatus: '启用状态',
              lastCheckedAt: '最近检查时间',
              lastStatus: '最近状态',
              failureReason: '失败原因',
            },
          },
        },
      },
      markStatus: true,
      pauseSource: true,
    });

    assert.equal(result.updates.length, 1);
    assert.equal(updates[0].tableName, 'creators');
    assert.equal(updates[0].recordId, 'rec_fail');
    assert.equal(updates[0].fields['最近状态'], '需人工处理');
    assert.equal(updates[0].fields['启用状态'], '暂停');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
