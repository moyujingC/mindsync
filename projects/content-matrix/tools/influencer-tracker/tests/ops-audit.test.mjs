import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildOpsAudit } from '../src/jobs/ops-audit.mjs';

test('buildOpsAudit reports missing days in a 7-day window', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-ops-audit-'));
  const runsDir = join(dir, 'runs');
  const outputPath = join(dir, 'ops-audits', '2026-07-15.md');

  await mkdir(join(runsDir, '2026-07-15'), { recursive: true });
  await writeFile(join(runsDir, '2026-07-15', 'run.json'), JSON.stringify({
    generatedAt: '2026-07-15T10:00:00.000Z',
  }), 'utf8');

  try {
    const result = await buildOpsAudit({
      endDate: '2026-07-15',
      requiredDays: 7,
      runsDir,
      outputPath,
    });

    assert.equal(result.summary.coveredDayCount, 1);
    assert.equal(result.summary.missingDayCount, 6);
    assert.equal(result.summary.passes, false);

    const markdown = await readFile(outputPath, 'utf8');
    assert.match(markdown, /是否通过：否/);
    assert.match(markdown, /2026-07-15 \| 运行报告数 1/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
