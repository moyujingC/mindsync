import test from 'node:test';
import assert from 'node:assert/strict';
import { screenFeishuContents } from '../src/jobs/screen-content.mjs';
import { processNextContentTask } from '../src/jobs/content-processing-worker.mjs';

const contentFields = {
  uniqueKey: '内容唯一键', platform: '平台', creator: '博主', publishedAt: '发布时间', title: '标题', description: '正文/简介', url: '内容链接', contentType: '内容类型',
  likeCount: '点赞数', commentCount: '评论数', favoriteCount: '收藏数', shareCount: '转发/分享数',
  screeningStatus: '筛选状态', topicPotentialScore: '爆款选题分', substanceSignalScore: '干货信号分', topicRecommendation: '选题建议', substanceRecommendation: '深读建议', scoredAt: '评分时间', screeningNote: '评分说明',
};

test('screening queues L2 before dependent topic insight and deduplicates reruns', async () => {
  const taskRecords = [];
  const client = {
    listFields: async () => Object.values(contentFields).map((field_name) => ({ field_name })),
    createField: async () => {}, listRecords: async (table) => table === 'contents' ? contentRecords() : taskRecords,
    updateRecord: async () => {}, listViews: async () => [{ name: '爆款选题候选' }, { name: '建议深读（L2）' }],
    createView: async () => {}, setViewFilter: async () => {}, setViewSort: async () => {}, setViewVisibleFields: async () => {},
    createTable: async () => ({ table_id: 'tbl_tasks' }),
    createRecords: async (_table, records) => taskRecords.push(...records.map((fields, index) => ({ record_id: `task_${index}`, fields }))),
  };
  const config = { tables: { contents: { fields: contentFields } } };
  const first = await screenFeishuContents({ feishuClient: client, feishuConfig: config, scoredAt: '2026-07-27T00:00:00Z' });
  assert.equal(first.taskQueue.createdCount, 4);
  const topic = first.taskQueue.tasks.find((task) => task.taskType === '选题洞察');
  assert.equal(topic.status, '等待依赖');
  assert.match(topic.dependencyTaskKey, /L2 内容提纯$/);
  const second = await screenFeishuContents({ feishuClient: client, feishuConfig: config, scoredAt: '2026-07-27T00:00:00Z' });
  assert.equal(second.taskQueue.createdCount, 0);
});

function contentRecords() {
  return [1, 2, 3, 4, 5].map((count) => ({ record_id: `rec_${count}`, fields: {
    内容唯一键: `douyin:${count}`, 平台: '抖音', 博主: 'VA7', 发布时间: '2026-07-26T00:00:00Z', 标题: `内容 ${count}`, '正文/简介': '企业 AI 交付', 内容链接: `https://example.com/${count}`, 内容类型: '视频',
    点赞数: count, 评论数: count, 收藏数: count, '转发/分享数': count,
  }}));
}

test('processing worker releases a dependent insight only after L2 completes', async () => {
  const updates = [];
  const result = await processNextContentTask({
    feishuClient: taskClient([
      taskRecord('l2', { 任务唯一键: 'douyin:1::L2 内容提纯', 状态: '完成' }),
      taskRecord('insight', { 任务唯一键: 'douyin:1::选题洞察', 状态: '等待依赖', 依赖任务: 'douyin:1::L2 内容提纯' }),
    ], updates),
    feishuConfig: taskConfig(),
  });

  assert.equal(result.processed, false);
  assert.equal(result.reason, 'empty-or-waiting');
  assert.equal(updates.length, 1);
  assert.equal(updates[0].recordId, 'insight');
  assert.equal(updates[0].fields.状态, '待处理');
  assert.match(updates[0].fields.更新时间, /^\d{4}-\d{2}-\d{2}T/);
});

test('processing worker sends a dependent insight to manual review when L2 fails', async () => {
  const updates = [];
  const result = await processNextContentTask({
    feishuClient: taskClient([
      taskRecord('l2', { 任务唯一键: 'douyin:1::L2 内容提纯', 状态: '失败' }),
      taskRecord('insight', { 任务唯一键: 'douyin:1::选题洞察', 状态: '等待依赖', 依赖任务: 'douyin:1::L2 内容提纯' }),
    ], updates),
    feishuConfig: taskConfig(),
  });

  assert.equal(result.processed, false);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].recordId, 'insight');
  assert.equal(updates[0].fields.状态, '需人工处理');
  assert.equal(updates[0].fields.错误摘要, '依赖的 L2 内容提纯未完成');
});

function taskConfig() {
  return {
    tables: {
      contentProcessingTasks: {
        fields: {
          taskKey: '任务唯一键', contentKey: '内容唯一键', taskType: '任务类型', triggerReason: '触发原因', status: '状态', priority: '优先级',
          targetAccount: '目标账号', dependencyTaskKey: '依赖任务', artifactPath: '产物路径', errorSummary: '错误摘要', createdAt: '创建时间', updatedAt: '更新时间',
        },
      },
    },
  };
}

function taskRecord(record_id, fields) {
  return { record_id, fields: { 内容唯一键: 'douyin:1', 任务类型: '选题洞察', 优先级: 80, ...fields } };
}

function taskClient(records, updates) {
  return {
    listRecords: async (table) => table === 'contentProcessingTasks' ? records : [],
    updateRecord: async (_table, recordId, fields) => updates.push({ recordId, fields }),
  };
}
