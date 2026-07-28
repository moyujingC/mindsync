import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { enrichVideoTranscripts, findSubtitle, findVideoUrl } from '../src/jobs/video-transcript.mjs';

test('video transcript uses platform subtitle before downloading or transcribing video', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'video-transcript-'));
  try {
    const collection = { contents: { items: [video({ captions: '1\n00:00:00,000 --> 00:00:01,000\n平台字幕\n', video: { play_addr: { url_list: ['https://example.test/video.mp4'] } } })] } };
    const result = await enrichVideoTranscripts({
      collection,
      outputDir: dir,
      fetchImpl: async () => { throw new Error('should not download'); },
      processMedia: async () => { throw new Error('should not transcribe'); },
    });
    const item = result.media.items[0];
    assert.equal(item.status, '已完成');
    assert.equal(item.source, '平台字幕');
    assert.equal(await readFile(item.refinedTextPath, 'utf8'), '平台字幕\n');
    assert.equal(result.contents.items[0].researchEvidence.source, '平台字幕');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('video transcript downloads and transcribes when no platform subtitle exists', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'video-transcript-'));
  try {
    const result = await enrichVideoTranscripts({
      collection: { contents: { items: [video({ video: { play_addr: { url_list: ['https://example.test/video.mp4'] } } })] } },
      outputDir: dir,
      fetchImpl: async () => new Response('video-bytes', { status: 200 }),
      processMedia: async ({ inputPath }) => {
        const refinedTextPath = `${inputPath}.refined.txt`;
        await writeFile(refinedTextPath, '语音转写结果\n');
        return {
          subtitlePath: `${inputPath}.srt`,
          originalTranscriptPath: `${inputPath}.original.srt`,
          refinedTextPath,
        };
      },
    });
    assert.equal(result.media.items[0].source, '语音转写');
    assert.equal(result.media.items[0].status, '已完成');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('video transcript records a failure without breaking the collected content', async () => {
  const result = await enrichVideoTranscripts({
    collection: { contents: { items: [video({})] } },
    outputDir: join(tmpdir(), 'video-transcript-missing'),
  });
  assert.equal(result.media.items[0].status, '失败');
  assert.match(result.media.items[0].error, /did not provide/);
  assert.equal(result.contents.items[0].researchEvidence, undefined);
});

test('media URL and subtitle discovery support TikHub nested response fields', () => {
  const raw = { video: { play_addr: { url_list: ['https://example.test/video.mp4'] } }, captions: { url: 'https://example.test/subtitle.srt' } };
  assert.equal(findVideoUrl(raw), 'https://example.test/video.mp4');
  assert.deepEqual(findSubtitle(raw), { url: 'https://example.test/subtitle.srt' });
});

test('video transcript rejects a content description that is mislabeled as a caption', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'video-transcript-caption-'));
  try {
    const result = await enrichVideoTranscripts({
      collection: { contents: { items: [video({
        caption: '这是一段视频简介，不是带时间轴的字幕。',
        video: { play_addr: { url_list: ['https://example.test/video.mp4'] } },
      })] } },
      outputDir: dir,
      fetchImpl: async () => new Response('video-bytes', { status: 200 }),
      processMedia: async ({ inputPath }) => {
        const refinedTextPath = `${inputPath}.refined.txt`;
        await writeFile(refinedTextPath, '语音转写结果\n');
        return {
          subtitlePath: `${inputPath}.srt`,
          originalTranscriptPath: `${inputPath}.original.srt`,
          refinedTextPath,
        };
      },
    });
    assert.equal(findSubtitle({ caption: '这是一段视频简介，不是带时间轴的字幕。' }), null);
    assert.equal(result.media.items[0].source, '语音转写');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function video(raw) {
  return { uniqueKey: 'douyin:123', title: '测试视频', contentType: '视频', raw };
}
