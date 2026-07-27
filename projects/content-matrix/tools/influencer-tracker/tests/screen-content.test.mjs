import test from 'node:test';
import assert from 'node:assert/strict';
import { screenFeishuContents } from '../src/jobs/screen-content.mjs';

const fields = {
  uniqueKey: '内容唯一键', platform: '平台', creator: '博主', publishedAt: '发布时间',
  likeCount: '点赞数', commentCount: '评论数', favoriteCount: '收藏数', shareCount: '转发/分享数',
  screeningStatus: '筛选状态', topicPotentialScore: '爆款选题分', substanceSignalScore: '干货信号分',
  topicRecommendation: '选题建议', substanceRecommendation: '深读建议', scoredAt: '评分时间', screeningNote: '评分说明',
};

test('screening creates missing fields, writes independent scores, and configures views', async () => {
  const updates = [];
  const fieldsCreated = [];
  const views = [];
  const taskRecords = [];
  const client = {
    listFields: async () => [],
    createField: async (_table, field) => fieldsCreated.push(field.field_name),
    listRecords: async (table) => table === 'contents' ? records() : taskRecords,
    updateRecord: async (_table, recordId, update) => updates.push({ recordId, update }),
    listViews: async () => [],
    createView: async (_table, view) => views.push(view.name),
    setViewFilter: async () => {}, setViewSort: async () => {}, setViewVisibleFields: async () => {},
    createTable: async () => ({ table_id: 'tbl_tasks' }),
    createRecords: async (_table, rows) => taskRecords.push(...rows.map((fields, index) => ({ record_id: `task_${index}`, fields }))),
  };
  const config = { tables: { contents: { fields } } };
  const result = await screenFeishuContents({ feishuClient: client, feishuConfig: config, scoredAt: '2026-07-27T00:00:00Z' });
  assert.equal(fieldsCreated.length, 7);
  assert.equal(updates.length, 5);
  assert.equal(result.scoreableCount, 5);
  assert.equal(result.topicCandidateCount, 2);
  assert.equal(result.l2CandidateCount, 2);
  assert.equal(result.taskQueue.createdTable, true);
  assert.deepEqual(views, ['爆款选题候选', '建议深读（L2）']);
  assert.equal(updates.at(-1).update['爆款选题分'], 100);
  assert.equal(updates.at(-1).update['干货信号分'], 100);
});

function records() {
  return [1, 2, 3, 4, 5].map((count) => ({
    record_id: `rec_${count}`,
    fields: {
      内容唯一键: `douyin:${count}`, 平台: '抖音', 博主: 'VA7', 发布时间: '2026-07-26T00:00:00Z',
      点赞数: count, 评论数: count, 收藏数: count, '转发/分享数': count,
    },
  }));
}
