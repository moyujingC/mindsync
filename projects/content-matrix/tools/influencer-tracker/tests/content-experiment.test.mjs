import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFieldNameMap, FEISHU_TABLE_SCHEMAS } from '../config/schema.mjs';
import { mapContentExperimentToFeishuFields } from '../src/feishu/client.mjs';
import { ensureContentExperimentTable, recordContentExperiment } from '../src/jobs/content-experiment.mjs';

function experiment(overrides = {}) {
  return {
    experimentId: 'exp-moyujing-001',
    topicTitle: '企业为什么不该按 Agent 个数采购',
    targetAccount: '墨予镜',
    contentFormat: '公众号文章',
    topicSource: '课题研究',
    hypothesis: '用具体采购误区开场，比泛泛介绍 Agent 更容易获得收藏。',
    evidenceRefs: 'douyin:7666057077659603391',
    primaryGoal: '收藏',
    status: '待发布',
    ...overrides,
  };
}

function fakeClient() {
  const calls = { createdTables: [], createdRecords: [], updatedRecords: [], views: [] };
  const records = [];
  return {
    calls,
    async createTable(schema) { calls.createdTables.push(schema); return { table_id: 'tbl_experiments' }; },
    async listViews() { return []; },
    async createView(_table, view) { calls.views.push(['create', view.name]); },
    async setViewFilter(_table, name) { calls.views.push(['filter', name]); },
    async setViewSort(_table, name) { calls.views.push(['sort', name]); },
    async setViewVisibleFields(_table, name) { calls.views.push(['fields', name]); },
    async listRecords() { return records; },
    async createRecords(_table, values) {
      calls.createdRecords.push(values);
      records.push({ record_id: 'rec_experiment_1', fields: values[0] });
      return ['rec_experiment_1'];
    },
    async updateRecord(_table, recordId, fields) { calls.updatedRecords.push({ recordId, fields }); },
  };
}

test('content experiment setup creates the dedicated table and review views once', async () => {
  const client = fakeClient();
  const config = { tables: {} };
  const result = await ensureContentExperimentTable({ feishuClient: client, feishuConfig: config });
  assert.equal(result.createdTable, true);
  assert.equal(config.tables.contentExperiments.tableId, 'tbl_experiments');
  assert.equal(client.calls.createdTables[0].tableName, '内容实验与反馈');
  assert.deepEqual(result.views.map((view) => view.name), ['待发布', '已发布待复盘']);
});

test('content experiment writes one record then updates the same experiment ID', async () => {
  const client = fakeClient();
  const config = { tables: {} };
  const created = await recordContentExperiment({ feishuClient: client, feishuConfig: config, experiment: experiment(), now: '2026-07-30T01:00:00.000Z' });
  const updated = await recordContentExperiment({
    feishuClient: client,
    feishuConfig: config,
    experiment: experiment({
      status: '已发布待复盘',
      platform: '公众号',
      publishUrl: 'https://mp.weixin.qq.com/s/example',
      publishedAt: '2026-07-30T02:00:00.000Z',
    }),
    now: '2026-07-30T03:00:00.000Z',
  });
  assert.equal(created.created, true);
  assert.equal(updated.updated, true);
  assert.equal(client.calls.createdRecords.length, 1);
  assert.equal(client.calls.updatedRecords[0].recordId, 'rec_experiment_1');
  assert.equal(client.calls.updatedRecords[0].fields.创建时间, undefined);
});

test('content experiment requires a publish link after it leaves the draft state', async () => {
  await assert.rejects(
    () => recordContentExperiment({ feishuClient: fakeClient(), feishuConfig: { tables: {} }, experiment: experiment({ status: '已发布待复盘' }) }),
    /publishUrl/,
  );
});

test('content experiment mapping preserves manual metrics without a derived success score', () => {
  const fields = buildFieldNameMap(FEISHU_TABLE_SCHEMAS.contentExperiments);
  const mapped = mapContentExperimentToFeishuFields(experiment({ metrics: { impressions: 3000, favorites: 42, qualifiedConsultations: 1 } }), fields);
  assert.equal(mapped['曝光/播放'], 3000);
  assert.equal(mapped.收藏, 42);
  assert.equal(mapped.有效咨询, 1);
  assert.equal(Object.hasOwn(mapped, '内容是否成功'), false);
});
