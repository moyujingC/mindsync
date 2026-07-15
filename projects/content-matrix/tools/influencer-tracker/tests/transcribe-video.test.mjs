import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cleanTranscript, normalizeSubtitleText, transcribeVideoArtifact } from '../src/jobs/transcribe-video.mjs';

test('normalizeSubtitleText strips srt markers and html', () => {
  const input = `1
00:00:01,000 --> 00:00:03,000
<i>你好</i>

2
00:00:04,000 --> 00:00:06,000
世界`;

  const result = normalizeSubtitleText(input);
  assert.equal(result, '你好\n世界');
});

test('cleanTranscript removes extra whitespace', () => {
  const result = cleanTranscript(' 你好 \n\n 世界  ');
  assert.equal(result, '你好\n世界');
});

test('transcribeVideoArtifact prefers subtitle files when present', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-transcribe-subtitle-'));

  try {
    await writeFile(join(dir, 'download-manifest.json'), `${JSON.stringify({
      artifactDir: dir,
      videoPath: join(dir, 'video.mp4'),
      downloadStatus: 'downloaded',
    }, null, 2)}\n`, 'utf8');
    await writeFile(join(dir, 'subtitle.srt'), `1
00:00:01,000 --> 00:00:03,000
你好

2
00:00:04,000 --> 00:00:06,000
世界
`, 'utf8');

    const result = await transcribeVideoArtifact({
      artifactDir: dir,
      execFileImpl: async () => {
        throw new Error('should not call external command when subtitle exists');
      },
    });

    const raw = await readFile(join(dir, 'speech-raw.txt'), 'utf8');
    const clean = await readFile(join(dir, 'speech-clean.txt'), 'utf8');
    const manifest = JSON.parse(await readFile(join(dir, 'transcribe-manifest.json'), 'utf8'));

    assert.equal(result.transcriptStatus, 'subtitle');
    assert.equal(raw.trim(), '你好\n世界');
    assert.equal(clean.trim(), '你好\n世界');
    assert.equal(manifest.transcriptStatus, 'subtitle');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('transcribeVideoArtifact falls back to whisper path', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-transcribe-whisper-'));
  const calls = [];

  try {
    const videoPath = join(dir, 'video.mp4');
    const audioPath = join(dir, 'audio.m4a');
    const whisperTxtPath = join(dir, 'audio.txt');

    await writeFile(join(dir, 'download-manifest.json'), `${JSON.stringify({
      artifactDir: dir,
      videoPath,
      downloadStatus: 'downloaded',
    }, null, 2)}\n`, 'utf8');
    await writeFile(videoPath, 'fake-video', 'utf8');

    const result = await transcribeVideoArtifact({
      artifactDir: dir,
      execFileImpl: async (command, args) => {
        calls.push({ command, args });
        if (command === 'ffmpeg') {
          await writeFile(audioPath, 'fake-audio', 'utf8');
          return { stdout: '', stderr: '' };
        }
        if (command === 'whisper') {
          await writeFile(whisperTxtPath, '这是 whisper 输出', 'utf8');
          return { stdout: '', stderr: '' };
        }
        throw new Error(`Unexpected command: ${command}`);
      },
    });

    const clean = await readFile(join(dir, 'speech-clean.txt'), 'utf8');
    const manifest = JSON.parse(await readFile(join(dir, 'transcribe-manifest.json'), 'utf8'));

    assert.equal(result.transcriptStatus, 'whisper');
    assert.equal(clean.trim(), '这是 whisper 输出');
    assert.equal(manifest.audioPath, audioPath);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].command, 'ffmpeg');
    assert.equal(calls[1].command, 'whisper');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
