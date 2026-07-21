import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildOpsAudit } from '../src/jobs/ops-audit.mjs';

test('buildOpsAudit reports missing days in a 7-day window', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-ops-audit-'));
  const runsDir = join(dir, 'runs');
  const downloadsDir = join(dir, 'downloads', 'douyin');
  const outputPath = join(dir, 'ops-audits', '2026-07-15.md');

  await mkdir(join(runsDir, '2026-07-15'), { recursive: true });
  await mkdir(join(downloadsDir, '抖音样例账号', 'dy-sample-001'), { recursive: true });
  await writeFile(join(runsDir, '2026-07-15', 'run.json'), JSON.stringify({
    generatedAt: '2026-07-15T10:00:00.000Z',
  }), 'utf8');
  await writeFile(join(downloadsDir, '抖音样例账号', 'dy-sample-001', 'download-manifest.json'), JSON.stringify({
    job: 'download',
    status: 'ok',
  }), 'utf8');

  try {
    const result = await buildOpsAudit({
      endDate: '2026-07-15',
      requiredDays: 7,
      runsDir,
      outputPath,
      downloadsRoot: downloadsDir,
    });

    assert.equal(result.summary.coveredDayCount, 1);
    assert.equal(result.summary.missingDayCount, 6);
    assert.equal(result.summary.passes, false);
    assert.equal(result.manifestCoverage.downloadCount, 1);

    const markdown = await readFile(outputPath, 'utf8');
    assert.match(markdown, /是否通过：否/);
    assert.match(markdown, /2026-07-15 \| 运行报告数 1/);
    assert.match(markdown, /download manifest：1/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
