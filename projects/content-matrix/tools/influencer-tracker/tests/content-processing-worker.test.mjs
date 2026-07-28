import test from 'node:test';
import assert from 'node:assert/strict';
import { screenFeishuContents } from '../src/jobs/screen-content.mjs';
import { processNextContentTask, writeTranscriptToFeishu } from '../src/jobs/content-processing-worker.mjs';

const contentFields = {
  uniqueKey: '内容唯一键', platform: '平台', creator: '博主', publishedAt: '发布时间', title: '标题', description: '正文/简介', url: '内容链接', contentType: '内容类型',
  likeCount: '点赞数', commentCount: '评论数', favoriteCount: '收藏数', shareCount: '转发/分享数',
  screeningStatus: '筛选状态', topicPotentialScore: '爆款选题分', substanceSignalScore: '干货信号分', topicRecommendation: '选题建议', substanceRecommendation: '深读建议', scoredAt: '评分时间', screeningNote: '评分说明',
};

test('screening queues only L2 tasks and deduplicates reruns', async () => {
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
  assert.equal(first.taskQueue.createdCount, 2);
  assert.deepEqual(first.taskQueue.tasks.map((task) => task.taskType), ['L2 内容提纯', 'L2 内容提纯']);
  const second = await screenFeishuContents({ feishuClient: client, feishuConfig: config, scoredAt: '2026-07-27T00:00:00Z' });
  assert.equal(second.taskQueue.createdCount, 0);
});

function contentRecords() {
  return [1, 2, 3, 4, 5].map((count) => ({ record_id: `rec_${count}`, fields: {
    内容唯一键: `douyin:${count}`, 平台: '抖音', 博主: 'VA7', 发布时间: '2026-07-26T00:00:00Z', 标题: `内容 ${count}`, '正文/简介': '企业 AI 交付', 内容链接: `https://example.com/${count}`, 内容类型: '视频',
    点赞数: count, 评论数: count, 收藏数: count, '转发/分享数': count,
  }}));
}

test('processing worker writes the clean transcript into the original Feishu content row', async () => {
  const createdFields = [];
  const updates = [];
  const result = await writeTranscriptToFeishu({
    feishuClient: {
      listFields: async () => [{ field_name: '内容提纯状态' }],
      createField: async (_table, field) => createdFields.push(field.field_name),
      updateRecord: async (_table, recordId, fields) => updates.push({ recordId, fields }),
    },
    feishuConfig: { tables: { contents: { fields: contentFields } } },
    content: { recordId: 'rec_content_1' },
    transcript: '清理后的字幕全文',
    source: '平台字幕',
    refinementStatus: '已完成',
  });

  assert.deepEqual(createdFields, ['文字稿来源', '文字稿']);
  assert.equal(result.written, true);
  assert.deepEqual(updates, [{ recordId: 'rec_content_1', fields: {
    内容提纯状态: '已完成', 文字稿来源: '平台字幕', 文字稿: '清理后的字幕全文',
  } }]);
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
