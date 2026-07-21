import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

test('README and component Skills only document registered npm commands', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const docs = [
    'README.md',
    'skills/content-ingestion/SKILL.md',
    'skills/market-research/SKILL.md',
    'skills/demand-insight/SKILL.md',
    'skills/publishing-feedback/SKILL.md',
  ];
  const documentedCommands = new Set();
  for (const relativePath of docs) {
    const raw = await readFile(`${root}/${relativePath}`, 'utf8');
    for (const match of raw.matchAll(/npm run ([\w:-]+)/g)) {
      documentedCommands.add(match[1]);
    }
  }

  for (const command of documentedCommands) {
    assert.ok(packageJson.scripts[command], `Missing package script for documented command: ${command}`);
  }
});
