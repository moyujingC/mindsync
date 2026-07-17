import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runFeishuActionWorker } from '../src/jobs/feishu-action-worker.mjs';

test('runFeishuActionWorker requires task field mapping', async () => {
  await assert.rejects(() => runFeishuActionWorker({
    loaded: {
      creators: [],
      feishuClient: {},
      feishuConfig: {
        tables: {
          creators: {
            fields: {
              name: '博主名称',
            },
          },
        },
      },
    },
    storePath: 'unused',
  }), /Missing creator task field mapping/);
});

test('worker-style task flow filters pending creators and reports backfill summary', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-worker-'));
  const storePath = join(dir, 'store.json');

  try {
    const updates = [];
    const creator = {
      id: 'rec_pending',
      recordId: 'rec_pending',
      name: '样例账号',
      platform: 'bilibili',
      externalId: '2',
      enabledStatus: '启用',
      collectAction: '待回溯',
      taskStatus: '空闲',
      collectSince: '2026-07-15T01:30:00.000Z',
      source: {
        kind: 'rss-file',
        path: 'fixtures/bilibili-rss.example.xml',
      },
    };
    const loaded = {
      creators: [
        creator,
        {
          ...creator,
          id: 'rec_idle',
          recordId: 'rec_idle',
          name: '空闲账号',
          collectAction: '无',
        },
      ],
      feishuClient: {
        async listRecords(tableName) {
          assert.equal(tableName, 'contents');
          return [];
        },
        async createRecords(tableName, records) {
          assert.equal(tableName, 'contents');
          assert.equal(records.length, 1);
          return ['rec_content_1'];
        },
        async updateRecord(tableName, recordId, fields) {
          updates.push({ tableName, recordId, fields });
        },
      },
      feishuConfig: {
        tables: {
          creators: {
            fields: creatorFields(),
          },
          contents: {
            fields: contentFields(),
          },
        },
      },
    };

    const result = await runFeishuActionWorker({
      loaded,
      storePath,
      limit: 20,
      dryRun: false,
      cwd: '/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker',
    });

    assert.equal(result.pendingCount, 1);
    assert.equal(result.successCount, 1);
    assert.equal(result.failedCount, 0);
    assert.match(result.results[0].summary, /回溯完成/);
    assert.equal(updates.length, 2);
    assert.equal(updates[0].fields['任务状态'], '执行中');
    assert.equal(updates[1].fields['采集动作'], '无');
    assert.equal(updates[1].fields['任务状态'], '完成');
    assert.match(updates[1].fields['任务报告'], /新增 1 条/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function creatorFields() {
  return {
    name: '博主名称',
    platform: '平台',
    externalId: '平台账号ID',
    homepageUrl: '主页链接',
    enabledStatus: '启用状态',
    checkFrequency: '检查频率',
    lastCheckedAt: '最近检查时间',
    latestContentAt: '最近内容时间',
    lastStatus: '最近状态',
    failureReason: '失败原因',
    sourceKind: '数据源类型',
    sourcePath: '数据源地址',
    collectAction: '采集动作',
    taskStatus: '任务状态',
    collectSince: '采集起始日期',
    taskReport: '任务报告',
    taskLockedAt: '任务锁定时间',
  };
}

function contentFields() {
  return {
    uniqueKey: '内容唯一键',
    platform: '平台',
    creator: '博主',
    externalId: '内容ID',
    url: '内容链接',
    title: '标题',
    description: '正文/简介',
    publishedAt: '发布时间',
    collectedAt: '采集时间',
    contentType: '内容类型',
    tags: '标签',
    likeCount: '点赞数',
    commentCount: '评论数',
    favoriteCount: '收藏数',
    shareCount: '转发/分享数',
    analysisStatus: '分析状态',
  };
}
