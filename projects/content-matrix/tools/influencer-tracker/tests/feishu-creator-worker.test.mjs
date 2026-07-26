import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runFeishuCreatorWorker } from '../src/jobs/feishu-creator-worker.mjs';

test('Feishu creator worker resolves a short link and updates the same creator record through collection', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'feishu-creator-worker-'));
  try {
    const updates = [];
    const creator = {
      id: 'rec_manual_creator',
      recordId: 'rec_manual_creator',
      name: '手工抖音账号',
      platform: '抖音',
      externalId: 'dyo59placeholder',
      sourceLink: 'https://v.douyin.com/short-creator',
      homepageUrl: '',
      enabledStatus: '启用',
      collectAction: '待解析链接',
      taskStatus: '空闲',
    };
    const result = await runFeishuCreatorWorker({
      loaded: {
        creators: [creator],
        feishuClient: {
          async updateRecord(tableName, recordId, fields) { updates.push({ tableName, recordId, fields }); },
        },
        feishuConfig: { tables: { creators: { fields: creatorFields() } } },
      },
      storePath: join(dir, 'store.json'),
      resolveLink: async () => ({
        kind: 'creator',
        platform: 'douyin',
        creatorId: 'MS4wLjABAAAA-sec-user',
        originalUrl: 'https://v.douyin.com/short-creator',
        finalUrl: 'https://www.douyin.com/user/dyo59placeholder?sec_uid=MS4wLjABAAAA-sec-user',
      }),
      collect: async ({ creator: prepared, backfillDays }) => {
        assert.equal(prepared.recordId, 'rec_manual_creator');
        assert.equal(prepared.externalId, 'MS4wLjABAAAA-sec-user');
        assert.equal(backfillDays, 90);
        return { contents: { createdCount: 2, duplicateCount: 0, items: [] }, engagementSnapshots: { createdCount: 2 } };
      },
    });

    assert.equal(result.successCount, 1);
    assert.equal(result.failedCount, 0);
    assert.deepEqual(updates.map((update) => update.recordId), [
      'rec_manual_creator',
      'rec_manual_creator',
      'rec_manual_creator',
    ]);
    assert.equal(updates[1].fields['平台账号ID'], 'MS4wLjABAAAA-sec-user');
    assert.equal(updates.at(-1).fields['任务状态'], '完成');
    assert.equal(updates.at(-1).fields['采集动作'], '无');
    assert.match(updates.at(-1).fields['任务报告'], /互动快照 2 条/);
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
    sourceLink: '来源链接',
    linkType: '链接类型',
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
