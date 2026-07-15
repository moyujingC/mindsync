import test from 'node:test';
import assert from 'node:assert/strict';
import { FEISHU_TABLE_SCHEMAS, buildFieldNameMap } from '../config/schema.mjs';
import { validateFeishuConfig } from '../src/feishu/config.mjs';

test('FEISHU_TABLE_SCHEMAS includes all MVP tables', () => {
  assert.deepEqual(Object.keys(FEISHU_TABLE_SCHEMAS), [
    'creators',
    'contents',
    'comments',
    'insights',
  ]);
});

test('buildFieldNameMap converts internal keys to Feishu field names', () => {
  const fieldMap = buildFieldNameMap(FEISHU_TABLE_SCHEMAS.creators);
  assert.equal(fieldMap.name, '博主名称');
  assert.equal(fieldMap.platform, '平台');
  assert.equal(fieldMap.failureReason, '失败原因');
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
    },
  };

  const result = validateFeishuConfig(config);
  assert.equal(result.ok, true);
});
