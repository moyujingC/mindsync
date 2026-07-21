import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { processLocalMedia } from '../src/jobs/process-media.mjs';
import { isSupportedMediaPath, transcribeLocalMedia } from '../src/jobs/transcribe-media.mjs';

test('transcribeLocalMedia extracts audio and records local subtitle artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'transcribe-media-'));
  const inputPath = join(dir, 'source.mp4');
  const calls = [];
  try {
    await writeFile(inputPath, 'placeholder');
    const result = await transcribeLocalMedia({
      inputPath,
      outputDir: join(dir, 'output'),
      sourceLabel: '本地测试视频',
      runCommand: async (command, args) => {
        calls.push({ command, args });
        if (command === 'whisper-test') {
          const audioPath = args[0];
          const outputDir = args[args.indexOf('--output_dir') + 1];
          await writeFile(join(outputDir, `${basename(audioPath, '.wav')}.srt`), '1\n00:00:00,000 --> 00:00:01,000\n测试字幕\n');
        }
      },
      ffmpegPath: 'ffmpeg-test',
      whisperPath: 'whisper-test',
    });

    assert.equal(result.status, 'ok');
    assert.equal(result.sourceLabel, '本地测试视频');
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], {
      command: 'ffmpeg-test',
      args: ['-y', '-i', inputPath, '-vn', '-ac', '1', '-ar', '16000', result.audioPath],
    });
    assert.equal(calls[1].command, 'whisper-test');
    assert.ok(calls[1].args.includes('--output_format'));
    assert.equal(await readFile(result.subtitlePath, 'utf8'), '1\n00:00:00,000 --> 00:00:01,000\n测试字幕\n');
    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'));
    assert.equal(manifest.job, 'transcribe-media');
    assert.equal(manifest.output.model, 'base');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('transcribeLocalMedia writes a failed manifest when a local tool fails', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'transcribe-media-'));
  const inputPath = join(dir, 'source.mp3');
  try {
    await writeFile(inputPath, 'placeholder');
    await assert.rejects(
      () => transcribeLocalMedia({
        inputPath,
        outputDir: join(dir, 'output'),
        runCommand: async () => {
          throw new Error('ffmpeg unavailable');
        },
      }),
      /ffmpeg unavailable/,
    );
    const manifestPath = join(dir, 'output', 'source', 'transcribe-media-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    assert.equal(manifest.status, 'failed');
    assert.equal(manifest.error.message, 'ffmpeg unavailable');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('processLocalMedia chains a local transcript into the existing refinement workflow', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'process-media-'));
  try {
    const subtitlePath = join(dir, 'source.srt');
    const refinedPath = join(dir, 'source.refined.txt');
    const result = await processLocalMedia({
      inputPath: join(dir, 'source.mp4'),
      outputDir: join(dir, 'output'),
      transcribe: async () => ({
        sourceLabel: '本地样本',
        inputPath: join(dir, 'source.mp4'),
        audioPath: join(dir, 'source.audio.wav'),
        subtitlePath,
        manifestPath: join(dir, 'transcribe-media-manifest.json'),
      }),
      refine: async ({ inputPath, outputDir, sourceLabel }) => {
        assert.equal(inputPath, subtitlePath);
        assert.equal(outputDir, dir);
        assert.equal(sourceLabel, '本地样本');
        return {
          originalPath: join(dir, 'source.original.srt'),
          refinedPath,
          manifestPath: join(dir, 'refine-media-manifest.json'),
        };
      },
    });

    assert.equal(result.refinedTextPath, refinedPath);
    assert.equal(result.originalTranscriptPath, join(dir, 'source.original.srt'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('local media extension contract excludes platform links and text transcripts', () => {
  assert.equal(isSupportedMediaPath('/tmp/video.mp4'), true);
  assert.equal(isSupportedMediaPath('/tmp/audio.m4a'), true);
  assert.equal(isSupportedMediaPath('/tmp/transcript.srt'), false);
  assert.equal(isSupportedMediaPath('https://example.com/video.mp4'), false);
});
