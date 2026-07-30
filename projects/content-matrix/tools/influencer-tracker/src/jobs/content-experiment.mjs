import { FEISHU_TABLE_SCHEMAS, buildFieldNameMap } from '../../config/schema.mjs';
import { mapContentExperimentToFeishuFields, mapFeishuContentExperimentRecord } from '../feishu/client.mjs';

const VIEW_DEFINITIONS = [
  {
    name: '待发布',
    filter: { logic: 'and', conditions: [['实验状态', '==', '待发布']] },
    sort: [{ field: '创建时间', desc: true }],
    visibleFields: ['选题标题', '账号', '内容形态', '选题来源', '选题假设', '来源证据', '目标动作', '实验状态', '创建时间'],
  },
  {
    name: '已发布待复盘',
    filter: { logic: 'and', conditions: [['实验状态', '==', '已发布待复盘']] },
    sort: [{ field: '发布时间', desc: true }],
    visibleFields: ['选题标题', '发布平台', '发布时间', '观察截至', '选题来源', '目标动作', '曝光/播放', '收藏', '评论', '私信', '有效反馈', '有效咨询'],
  },
];

export async function ensureContentExperimentTable({ feishuClient, feishuConfig, dryRun = false }) {
  const schema = FEISHU_TABLE_SCHEMAS.contentExperiments;
  let table = feishuConfig.tables.contentExperiments;
  let createdTable = false;
  if (!table) {
    if (dryRun) return { createdTable: true, tableId: null, views: VIEW_DEFINITIONS.map(({ name }) => ({ name, created: true })) };
    const created = await feishuClient.createTable(schema);
    table = { tableId: created.table_id ?? created.id, fields: buildFieldNameMap(schema) };
    feishuConfig.tables.contentExperiments = table;
    createdTable = true;
  }
  const views = await ensureViews({ feishuClient, dryRun });
  return { createdTable, tableId: table.tableId, views };
}

export async function recordContentExperiment({ feishuClient, feishuConfig, experiment, dryRun = false, now = new Date().toISOString() }) {
  validateExperiment(experiment);
  await ensureContentExperimentTable({ feishuClient, feishuConfig, dryRun });
  if (dryRun) return { created: false, updated: false, experimentId: experiment.experimentId, fields: mapContentExperimentToFeishuFields({ ...experiment, createdAt: now, updatedAt: now }, feishuConfig.tables.contentExperiments.fields) };

  const fields = feishuConfig.tables.contentExperiments.fields;
  const records = await feishuClient.listRecords('contentExperiments');
  const existing = records.map((record) => mapFeishuContentExperimentRecord(record, fields))
    .find((record) => record.experimentId === experiment.experimentId);
  const timestamps = { createdAt: experiment.createdAt ?? now, updatedAt: now };
  const mapped = mapContentExperimentToFeishuFields({ ...experiment, ...timestamps }, fields);
  if (existing) {
    delete mapped[fields.createdAt];
    await feishuClient.updateRecord('contentExperiments', existing.recordId, mapped);
    return { created: false, updated: true, recordId: existing.recordId, experimentId: experiment.experimentId };
  }
  const [recordId] = await feishuClient.createRecords('contentExperiments', [mapped]);
  return { created: true, updated: false, recordId: recordId?.record_id ?? recordId, experimentId: experiment.experimentId };
}

function validateExperiment(experiment) {
  for (const key of ['experimentId', 'topicTitle', 'targetAccount', 'contentFormat', 'topicSource', 'hypothesis', 'primaryGoal', 'status']) {
    if (!String(experiment?.[key] ?? '').trim()) throw new Error(`Missing experiment field: ${key}`);
  }
  if (experiment.status !== '待发布' && !isHttpUrl(experiment.publishUrl)) {
    throw new Error('A valid publishUrl is required unless experiment status is 待发布');
  }
}

async function ensureViews({ feishuClient, dryRun }) {
  const existing = new Set((await feishuClient.listViews('contentExperiments')).map((view) => view.view_name ?? view.name));
  const results = [];
  for (const definition of VIEW_DEFINITIONS) {
    const created = !existing.has(definition.name);
    if (created && !dryRun) await feishuClient.createView('contentExperiments', { name: definition.name, type: 'grid' });
    if (!dryRun) {
      await feishuClient.setViewFilter('contentExperiments', definition.name, definition.filter);
      await feishuClient.setViewSort('contentExperiments', definition.name, definition.sort);
      await feishuClient.setViewVisibleFields('contentExperiments', definition.name, definition.visibleFields);
    }
    results.push({ name: definition.name, created });
  }
  return results;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
