import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeJobManifest, summarizeManifestCoverage } from '../src/utils/manifest.mjs';

test('writeJobManifest writes a unified manifest structure', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-manifest-'));
  const manifestPath = join(dir, 'download-manifest.json');

  try {
    const manifest = await writeJobManifest({
      manifestPath,
      job: 'download',
      status: 'ok',
      input: { contentExternalId: 'BV1sample001' },
      output: { videoPath: null },
    });

    const saved = JSON.parse(await readFile(manifestPath, 'utf8'));
    assert.equal(manifest.job, 'download');
    assert.equal(saved.version, 1);
    assert.equal(saved.job, 'download');
    assert.equal(saved.status, 'ok');
    assert.equal(saved.input.contentExternalId, 'BV1sample001');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('summarizeManifestCoverage counts artifact manifests', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-manifest-coverage-'));
  const artifactDir = join(dir, 'B站样例账号', 'BV1sample001');

  try {
    await mkdir(artifactDir, { recursive: true });
    await writeFile(join(artifactDir, 'download-manifest.json'), JSON.stringify({ job: 'download' }), 'utf8');
    await writeFile(join(artifactDir, 'transcribe-manifest.json'), JSON.stringify({ job: 'transcribe' }), 'utf8');

    const summary = await summarizeManifestCoverage(dir);
    assert.equal(summary.artifactCount, 1);
    assert.equal(summary.downloadCount, 1);
    assert.equal(summary.transcribeCount, 1);
    assert.equal(summary.commentsCount, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
