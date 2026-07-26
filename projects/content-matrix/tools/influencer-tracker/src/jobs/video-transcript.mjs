import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { processLocalMedia } from './process-media.mjs';
import { refineMediaText } from './refine-media.mjs';

const MAX_MEDIA_BYTES = 300 * 1024 * 1024;

// Turn the media URL returned by TikHub into an auditable local transcript.
export async function enrichVideoTranscripts({
  collection,
  outputDir,
  fetchImpl = globalThis.fetch,
  processMedia = processLocalMedia,
  refineSubtitle = refineMediaText,
}) {
  const resolvedOutputDir = resolve(outputDir);
  const results = [];

  for (const content of collection.contents?.items ?? []) {
    if (content.contentType !== '视频') continue;
    const result = await enrichOneVideo({
      content,
      outputDir: resolvedOutputDir,
      fetchImpl,
      processMedia,
      refineSubtitle,
    });
    content.transcript = result;
    if (result.status === '已完成') {
      content.refinedText = await readFile(result.refinedTextPath, 'utf8');
      content.researchEvidence = {
        refinedTextPath: result.refinedTextPath,
        characterCount: content.refinedText.trim().length,
        source: result.source,
      };
    }
    results.push({ contentUniqueKey: content.uniqueKey, ...result });
  }

  return {
    ...collection,
    media: {
      videoCount: results.length,
      completedCount: results.filter((result) => result.status === '已完成').length,
      failedCount: results.filter((result) => result.status === '失败').length,
      items: results,
    },
  };
}

async function enrichOneVideo({ content, outputDir, fetchImpl, processMedia, refineSubtitle }) {
  const artifactDir = join(outputDir, safeName(content.uniqueKey));
  await mkdir(artifactDir, { recursive: true });
  try {
    const subtitle = findSubtitle(content.raw);
    if (subtitle?.text) {
      const subtitlePath = join(artifactDir, `platform-subtitle${subtitle.extension}`);
      await writeFile(subtitlePath, subtitle.text, 'utf8');
      const refinement = await refineSubtitle({
        inputPath: subtitlePath,
        outputDir: artifactDir,
        sourceLabel: content.title,
      });
      return completed({ source: '平台字幕', refinement, artifactDir });
    }
    if (subtitle?.url) {
      const subtitlePath = join(artifactDir, `platform-subtitle${extensionForUrl(subtitle.url, '.srt')}`);
      await downloadToFile({ url: subtitle.url, outputPath: subtitlePath, fetchImpl, maxBytes: 10 * 1024 * 1024 });
      const refinement = await refineSubtitle({ inputPath: subtitlePath, outputDir: artifactDir, sourceLabel: content.title });
      return completed({ source: '平台字幕', refinement, artifactDir });
    }

    const videoUrl = findVideoUrl(content.raw);
    if (!videoUrl) throw new Error('TikHub detail did not provide an accessible subtitle or video URL');
    const videoPath = join(artifactDir, `source${extensionForUrl(videoUrl, '.mp4')}`);
    await downloadToFile({ url: videoUrl, outputPath: videoPath, fetchImpl, maxBytes: MAX_MEDIA_BYTES });
    const processing = await processMedia({
      inputPath: videoPath,
      outputDir: artifactDir,
      sourceLabel: content.title,
      model: process.env.WHISPER_MODEL ?? 'base',
      language: 'zh',
    });
    return {
      status: '已完成',
      source: '语音转写',
      artifactDir,
      mediaPath: videoPath,
      subtitlePath: processing.subtitlePath,
      originalTranscriptPath: processing.originalTranscriptPath,
      refinedTextPath: processing.refinedTextPath,
    };
  } catch (error) {
    return {
      status: '失败',
      source: '未获得文字稿',
      artifactDir,
      error: summarizeError(error),
    };
  }
}

function completed({ source, refinement, artifactDir }) {
  return {
    status: '已完成',
    source,
    artifactDir,
    subtitlePath: refinement.inputPath,
    originalTranscriptPath: refinement.originalPath,
    refinedTextPath: refinement.refinedPath,
  };
}

export function findSubtitle(value) {
  const candidates = collectValues(value, /(?:subtitle|caption|transcript)/i);
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && /^https:\/\//i.test(candidate)) return { url: candidate };
    if (typeof candidate === 'string' && candidate.trim().length > 0 && looksLikeSubtitle(candidate)) {
      return { text: candidate, extension: candidate.includes('WEBVTT') ? '.vtt' : '.srt' };
    }
  }
  return null;
}

export function findVideoUrl(value) {
  const candidates = collectValues(value, /(?:play_addr|play_url|video_url|download_addr|download_url)/i);
  return candidates.find((candidate) => typeof candidate === 'string' && /^https:\/\//i.test(candidate)) ?? null;
}

function collectValues(value, keyPattern, values = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectValues(item, keyPattern, values);
    return values;
  }
  if (!value || typeof value !== 'object') return values;
  for (const [key, item] of Object.entries(value)) {
    if (keyPattern.test(key)) {
      if (typeof item === 'string') values.push(item);
      if (Array.isArray(item)) values.push(...item.filter((entry) => typeof entry === 'string'));
      // TikHub commonly nests URL lists beneath fields such as video.play_addr.
      collectStrings(item, values);
    }
    collectValues(item, keyPattern, values);
  }
  return values;
}

function collectStrings(value, values) {
  if (typeof value === 'string') {
    values.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, values));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, values));
  }
}

function looksLikeSubtitle(value) {
  return value.includes('\n') || value.includes('-->') || value.includes('WEBVTT');
}

async function downloadToFile({ url, outputPath, fetchImpl, maxBytes }) {
  const response = await fetchImpl(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Media download failed: ${response.status}`);
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) throw new Error(`Media exceeds ${Math.round(maxBytes / 1024 / 1024)} MB limit`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maxBytes) throw new Error(`Media exceeds ${Math.round(maxBytes / 1024 / 1024)} MB limit`);
  await writeFile(outputPath, bytes);
}

function extensionForUrl(url, fallback) {
  try {
    const extension = extname(basename(new URL(url).pathname)).toLowerCase();
    return extension || fallback;
  } catch {
    return fallback;
  }
}

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function summarizeError(error) {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  return message.replace(/\s+/g, ' ').slice(0, 300);
}
