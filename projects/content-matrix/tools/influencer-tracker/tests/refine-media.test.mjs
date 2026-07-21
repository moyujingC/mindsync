import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { refineMediaText } from '../src/jobs/refine-media.mjs';

test('refineMediaText preserves original text and produces a clean transcript from SRT subtitles', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'refine-media-'));
  const inputPath = join(dir, 'source.srt');
  try {
    await writeFile(inputPath, '1\n00:00:00,000 --> 00:00:02,000\n大家好，今天聊企业 AI。\n\n2\n00:00:02,000 --> 00:00:04,000\n\n先从一个流程开始。\n', 'utf8');
    const result = await refineMediaText({ inputPath, outputDir: join(dir, 'output'), sourceLabel: '测试视频' });

    assert.equal(result.status, 'ok');
    assert.equal(await readFile(result.originalPath, 'utf8'), await readFile(inputPath, 'utf8'));
    assert.equal(await readFile(result.refinedPath, 'utf8'), '大家好，今天聊企业 AI。\n先从一个流程开始。\n');
    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'));
    assert.equal(manifest.job, 'refine-media');
    assert.equal(manifest.output.sourceLabel, '测试视频');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('refineMediaText rejects unsupported file extensions', async () => {
  await assert.rejects(
    () => refineMediaText({ inputPath: '/tmp/video.mp4', outputDir: '/tmp/refine-media' }),
    /supports subtitle or transcript text files/,
  );
});
