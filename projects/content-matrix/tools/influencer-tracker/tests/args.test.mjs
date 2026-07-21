import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/utils/args.mjs';

test('parseArgs supports explicitly disabling template comment collection', () => {
  assert.equal(parseArgs(['--no-comments']).includeComments, false);
  assert.equal(parseArgs(['--include-comments']).includeComments, true);
});
