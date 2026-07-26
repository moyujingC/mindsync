import test from 'node:test';
import assert from 'node:assert/strict';
import { FEISHU_TABLE_SCHEMAS, buildFieldNameMap } from '../config/schema.mjs';
import { validateFeishuConfig } from '../src/feishu/config.mjs';

test('FEISHU_TABLE_SCHEMAS includes all content intelligence tables', () => {
  assert.deepEqual(Object.keys(FEISHU_TABLE_SCHEMAS), [
    'creators',
    'contents',
    'comments',
    'engagementSnapshots',
    'insights',
    'researchRequests',
    'linkInbox',
  ]);
});

test('buildFieldNameMap converts internal keys to Feishu field names', () => {
  const fieldMap = buildFieldNameMap(FEISHU_TABLE_SCHEMAS.creators);
  assert.equal(fieldMap.name, '博主名称');
  assert.equal(fieldMap.platform, '平台');
  assert.equal(fieldMap.failureReason, '失败原因');
  assert.equal(fieldMap.sourceKind, '数据源类型');
  assert.equal(fieldMap.sourcePath, '数据源地址');
});

test('creator schema accepts the active collection sources, not retired RSS sources', () => {
  const options = FEISHU_TABLE_SCHEMAS.creators.fields.sourceKind.property.options
    .map((option) => option.name);

  assert.deepEqual(options, ['TikHub', '手工']);
});

test('insight schema only lists registered content accounts', () => {
  const options = FEISHU_TABLE_SCHEMAS.insights.fields.targetAccounts.property.options
    .map((option) => option.name);

  assert.deepEqual(options, ['墨予镜', '一镜一梳']);
});

test('link inbox schema separates received links from collected content', () => {
  const fields = FEISHU_TABLE_SCHEMAS.linkInbox.fields;
  assert.equal(fields.inboxId.field_name, '收件ID');
  assert.deepEqual(
    fields.status.property.options.map((option) => option.name),
    ['待处理', '处理中', '已完成', '失败', '需人工处理'],
  );
});

test('bootstrap schema can produce tracker config field maps', () => {
  const config = {
    appId: 'cli_xxx',
    appSecret: 'secret',
    baseAppToken: 'base',
    tables: {
      creators: {
        tableId: 'tbl_creators',
        fields: buildFieldNameMap(FEISHU_TABLE_SCHEMAS.creators),
      },
      contents: {
        tableId: 'tbl_contents',
        fields: buildFieldNameMap(FEISHU_TABLE_SCHEMAS.contents),
      },
      comments: {
        tableId: 'tbl_comments',
        fields: buildFieldNameMap(FEISHU_TABLE_SCHEMAS.comments),
      },
      insights: {
        tableId: 'tbl_insights',
        fields: buildFieldNameMap(FEISHU_TABLE_SCHEMAS.insights),
      },
      researchRequests: {
        tableId: 'tbl_research_requests',
        fields: buildFieldNameMap(FEISHU_TABLE_SCHEMAS.researchRequests),
      },
      linkInbox: {
        tableId: 'tbl_link_inbox',
        fields: buildFieldNameMap(FEISHU_TABLE_SCHEMAS.linkInbox),
      },
    },
  };

  const result = validateFeishuConfig(config);
  assert.equal(result.ok, true);
});
