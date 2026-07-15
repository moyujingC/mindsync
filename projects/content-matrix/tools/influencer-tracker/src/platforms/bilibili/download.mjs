import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { writeJobManifest } from '../../utils/manifest.mjs';

const execFile = promisify(execFileCallback);

export async function downloadBilibiliArtifact(content, {
  creator,
  outputRoot,
  downloader = null,
  fetcher = fetch,
}) {
  const creatorSlug = sanitizeSegment(creator?.name ?? creator?.externalId ?? 'creator');
  const contentSlug = sanitizeSegment(content.contentExternalId ?? 'video');
  const artifactDir = join(outputRoot, creatorSlug, contentSlug);
  await mkdir(artifactDir, { recursive: true });

  const metadataPath = join(artifactDir, 'metadata.json');
  const descriptionPath = join(artifactDir, 'description.txt');
  const manifestPath = join(artifactDir, 'download-manifest.json');

  const metadata = {
    platform: content.platform,
    creatorExternalId: content.creatorExternalId,
    creatorName: content.creatorName,
    contentExternalId: content.contentExternalId,
    title: content.title,
    url: content.url,
    publishedAt: content.publishedAt,
    raw: content.raw ?? {},
  };

  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  await writeFile(descriptionPath, content.description ?? '', 'utf8');

  const result = {
    artifactDir,
    metadataPath,
    descriptionPath,
    videoPath: null,
    downloadStatus: 'metadata-only',
  };

  if (downloader) {
    try {
      result.videoPath = await downloader({
        url: content.url,
        outputDir: artifactDir,
        content,
        creator,
        fetcher,
      });
      result.downloadStatus = result.videoPath ? 'downloaded' : 'metadata-only';
    } catch (error) {
      result.downloadStatus = 'failed';
      result.error = error.message;
    }
  }

  await writeJobManifest({
    manifestPath,
    job: 'download',
    status: result.downloadStatus === 'failed' ? 'failed' : 'ok',
    input: {
      platform: content.platform,
      creatorName: creator?.name,
      creatorExternalId: creator?.externalId,
      contentExternalId: content.contentExternalId,
      url: content.url,
    },
    output: result,
    legacyFields: result,
    error: result.error,
  });
  return result;
}

export async function downloadFile(url, outputPath, fetcher = fetch) {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await writeFile(outputPath, Buffer.from(arrayBuffer));
  return outputPath;
}

export function pickFilenameFromUrl(url, fallbackBase = 'video') {
  try {
    const name = basename(new URL(url).pathname) || fallbackBase;
    const extension = extname(name);
    if (extension) {
      return sanitizeSegment(name);
    }
  } catch {
    // ignore
  }
  return `${sanitizeSegment(fallbackBase)}.mp4`;
}

export async function downloadWithYtDlp({ url, outputDir }) {
  const outputTemplate = join(outputDir, 'video.%(ext)s');
  await execFile('yt-dlp', [
    '--no-progress',
    '--no-warnings',
    '--output',
    outputTemplate,
    url,
  ]);

  const files = await readdir(outputDir);
  const matched = files
    .filter((name) => name.startsWith('video.'))
    .sort((left, right) => left.localeCompare(right));

  if (matched.length === 0) {
    throw new Error('yt-dlp finished but no video file was found');
  }

  return join(outputDir, matched[0]);
}

function sanitizeSegment(value) {
  return String(value ?? 'unknown')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'unknown';
}
