import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirmCreatorTracking, prepareCreatorTracking } from '../src/jobs/creator-tracking.mjs';

const fields = { name: '博主名称', platform: '平台', externalId: '平台账号ID', homepageUrl: '主页链接', sourceLink: '来源链接', linkType: '链接类型', enabledStatus: '启用状态', checkFrequency: '检查频率', collectAction: '采集动作', taskStatus: '任务状态', sourceKind: '数据源类型', sourcePath: '数据源地址' };
const config = { tables: { creators: { fields } } };

test('creator tracking requires a topic before confirming', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'creator-tracking-'));
  try {
    const result = await prepareCreatorTracking({ sourceUrl: 'https://v.douyin.com/example', feishuConfig: config, feishuClient: { listRecords: async () => [] }, pendingStorePath: join(dir, 'pending.json'), resolveLink: async () => resolved() });
    assert.deepEqual(result.missing, ['主题']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('creator tracking writes only after explicit confirmation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'creator-tracking-'));
  try {
    const writes = [];
    const client = { listRecords: async () => [], createRecords: async (table, records) => { writes.push({ table, records }); return ['rec_new']; } };
    const pendingStorePath = join(dir, 'pending.json');
    const prepared = await prepareCreatorTracking({ sourceUrl: 'https://v.douyin.com/example', topics: '企业 AI 落地', frequency: '每日', feishuConfig: config, feishuClient: client, pendingStorePath, resolveLink: async () => resolved() });
    assert.equal(writes.length, 0);
    const confirmed = await confirmCreatorTracking({ confirmationId: prepared.confirmationId, feishuConfig: config, feishuClient: client, pendingStorePath });
    assert.equal(confirmed.status, '已启用');
    assert.equal(writes[0].records[0]['检查频率'], '每日');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('creator tracking updates an existing account without overwriting its name', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'creator-tracking-'));
  try {
    const updates = [];
    const client = {
      listRecords: async () => [{ record_id: 'rec_existing', fields: { 平台: '抖音', 平台账号ID: 'MS4wLjABAAAA-test', 博主名称: '已有博主' } }],
      updateRecord: async (table, recordId, update) => updates.push({ table, recordId, update }),
    };
    const pendingStorePath = join(dir, 'pending.json');
    const prepared = await prepareCreatorTracking({ sourceUrl: 'https://v.douyin.com/example', topics: 'AI 职业发展', feishuConfig: config, feishuClient: client, pendingStorePath, resolveLink: async () => resolved() });
    const confirmed = await confirmCreatorTracking({ confirmationId: prepared.confirmationId, feishuConfig: config, feishuClient: client, pendingStorePath });
    assert.equal(confirmed.action, 'updated');
    assert.equal(updates[0].recordId, 'rec_existing');
    assert.equal(updates[0].update.博主名称, '已有博主');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

function resolved() { return { kind: 'creator', platform: 'douyin', creatorId: 'MS4wLjABAAAA-test', originalUrl: 'https://v.douyin.com/example', finalUrl: 'https://www.douyin.com/user/test?sec_uid=MS4wLjABAAAA-test' }; }
