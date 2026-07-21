import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

test('weekly review CLI requires explicit historical mode and dates', () => {
  const result = spawnSync(process.execPath, ['src/cli/weekly-review.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /frozen historical summary/);
});
