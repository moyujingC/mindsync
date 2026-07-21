import test from 'node:test';
import assert from 'node:assert/strict';
import { LarkCliBitableClient, parseJsonFromStdout } from '../src/feishu/lark-cli-client.mjs';
import { summarizeFeishuField } from '../src/feishu/client.mjs';

test('parseJsonFromStdout accepts plain JSON', () => {
  assert.deepEqual(parseJsonFromStdout('{"ok":true}\n'), { ok: true });
});

test('parseJsonFromStdout extracts JSON after lark-cli banner', () => {
  assert.deepEqual(parseJsonFromStdout('lark-cli v1.2.3\n{"data":{"record_id_list":["rec_1"]}}\n'), {
    data: {
      record_id_list: ['rec_1'],
    },
  });
});

test('LarkCliBitableClient lists fields with the configured user identity', async () => {
  const calls = [];
  const client = new LarkCliBitableClient({
    mode: 'lark-cli',
    baseAppToken: 'base-test',
    as: 'user',
    bin: 'mock-lark',
    tables: { contents: { tableId: 'tbl_contents', fields: {} } },
  });
  client.run = async (args) => {
    calls.push(args);
    return { data: { items: [{ field_id: 'fld_1', field_name: '内容唯一键', type: 1 }] } };
  };

  const fields = await client.listFields('contents');
  assert.deepEqual(fields, [{ field_id: 'fld_1', field_name: '内容唯一键', type: 1 }]);
  assert.deepEqual(calls[0], [
    'base', '+field-list', '--as', 'user', '--base-token', 'base-test', '--table-id', 'tbl_contents', '--format', 'json',
  ]);
});

test('summarizeFeishuField supports lark-cli field names', () => {
  assert.deepEqual(summarizeFeishuField({ id: 'fld_1', name: '内容唯一键', type: 'text' }), {
    fieldId: 'fld_1',
    fieldName: '内容唯一键',
    type: 'text',
    isPrimary: false,
  });
});
