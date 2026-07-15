import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonFromStdout } from '../src/feishu/lark-cli-client.mjs';

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
