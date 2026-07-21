import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { writeJobManifest } from '../utils/manifest.mjs';

const SUPPORTED_EXTENSIONS = new Set(['.srt', '.vtt', '.txt']);

export async function refineMediaText({ inputPath, outputDir, sourceLabel = null }) {
  const resolvedInputPath = resolve(inputPath);
  const extension = extname(resolvedInputPath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error('Media refinement supports subtitle or transcript text files: .srt, .vtt, .txt');
  }

  const resolvedOutputDir = resolve(outputDir);
  const baseName = basename(resolvedInputPath, extension);
  const originalPath = join(resolvedOutputDir, `${baseName}.original${extension}`);
  const refinedPath = join(resolvedOutputDir, `${baseName}.refined.txt`);
  const manifestPath = join(resolvedOutputDir, 'refine-media-manifest.json');
  await mkdir(resolvedOutputDir, { recursive: true });
  const originalText = await readFile(resolvedInputPath, 'utf8');
  const refinedText = normalizeMediaText(originalText, extension);
  await copyFile(resolvedInputPath, originalPath);
  await writeFile(refinedPath, `${refinedText}\n`, 'utf8');

  const result = {
    status: 'ok',
    sourceLabel: sourceLabel ?? baseName,
    inputPath: resolvedInputPath,
    originalPath,
    refinedPath,
    characterCount: refinedText.length,
  };
  await writeJobManifest({
    manifestPath,
    job: 'refine-media',
    status: 'ok',
    input: { inputPath: resolvedInputPath, sourceLabel: result.sourceLabel },
    output: result,
  });
  return { ...result, manifestPath };
}

export function normalizeMediaText(text, extension = '.txt') {
  const lines = String(text ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !isSubtitleMetadata(line, extension));
  return lines.join('\n').replace(/[ \t]+/g, ' ').trim();
}

function isSubtitleMetadata(line, extension) {
  if (/^\d+$/.test(line)) {
    return true;
  }
  if (/^WEBVTT/i.test(line) && extension === '.vtt') {
    return true;
  }
  return /\d{2}:\d{2}(?::\d{2})?[.,:]\d{2,3}\s+-->\s+\d{2}:\d{2}(?::\d{2})?[.,:]\d{2,3}/.test(line);
}
