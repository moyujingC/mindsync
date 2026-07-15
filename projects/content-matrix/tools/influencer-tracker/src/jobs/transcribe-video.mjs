import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { readJsonFile } from '../utils/json-file.mjs';
import { writeJobManifest } from '../utils/manifest.mjs';

const execFile = promisify(execFileCallback);

export async function transcribeVideoArtifact({
  artifactDir,
  mode = 'auto',
  language = 'zh',
  whisperModel = 'turbo',
  ffmpegCommand = 'ffmpeg',
  whisperCommand = 'whisper',
  execFileImpl = execFile,
}) {
  const resolvedArtifactDir = resolve(artifactDir);
  const manifestPath = join(resolvedArtifactDir, 'transcribe-manifest.json');
  const rawPath = join(resolvedArtifactDir, 'speech-raw.txt');
  const cleanPath = join(resolvedArtifactDir, 'speech-clean.txt');
  const audioPath = join(resolvedArtifactDir, 'audio.m4a');
  const downloadManifest = await loadDownloadManifest(resolvedArtifactDir);

  const result = {
    artifactDir: resolvedArtifactDir,
    source: null,
    audioPath: null,
    speechRawPath: rawPath,
    speechCleanPath: cleanPath,
    transcriptStatus: 'failed',
  };

  try {
    const subtitlePath = await findSubtitleFile(resolvedArtifactDir);
    if (subtitlePath) {
      const subtitleText = await readFile(subtitlePath, 'utf8');
      const normalized = normalizeSubtitleText(subtitleText);
      await writeTranscriptFiles({ rawPath, cleanPath, rawText: normalized, cleanText: cleanTranscript(normalized) });
      result.source = subtitlePath;
      result.transcriptStatus = 'subtitle';
    } else {
      if (mode === 'subtitle-only') {
        throw new Error('No subtitle file found in artifact directory');
      }

      const videoPath = downloadManifest.videoPath;
      if (!videoPath) {
        throw new Error('No videoPath found in download-manifest.json');
      }

      await ensureParentDir(audioPath);
      await extractAudio({
        ffmpegCommand,
        execFileImpl,
        videoPath,
        audioPath,
      });
      result.audioPath = audioPath;

      const whisperRawPath = await runWhisper({
        artifactDir: resolvedArtifactDir,
        whisperCommand,
        execFileImpl,
        audioPath,
        language,
        whisperModel,
      });

      const whisperRawText = await readFile(whisperRawPath, 'utf8');
      const cleanText = cleanTranscript(whisperRawText);
      await writeTranscriptFiles({ rawPath, cleanPath, rawText: whisperRawText, cleanText });
      result.source = videoPath;
      result.transcriptStatus = 'whisper';
    }
  } catch (error) {
    result.error = error.message;
  }

  await writeJobManifest({
    manifestPath,
    job: 'transcribe',
    status: result.transcriptStatus === 'failed' ? 'failed' : 'ok',
    input: {
      artifactDir: resolvedArtifactDir,
      mode,
      language,
      whisperModel,
      videoPath: downloadManifest.videoPath ?? null,
    },
    output: result,
    legacyFields: result,
    error: result.error,
  });
  return result;
}

async function loadDownloadManifest(artifactDir) {
  const manifestPath = join(artifactDir, 'download-manifest.json');
  return readJsonFile(manifestPath);
}

async function findSubtitleFile(artifactDir) {
  const candidates = [
    'subtitle.srt',
    'subtitle.vtt',
    'captions.srt',
    'captions.vtt',
  ];

  for (const candidate of candidates) {
    const candidatePath = join(artifactDir, candidate);
    if (await fileExists(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureParentDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

async function extractAudio({ ffmpegCommand, execFileImpl, videoPath, audioPath }) {
  await execFileImpl(ffmpegCommand, [
    '-y',
    '-i',
    videoPath,
    '-vn',
    '-acodec',
    'aac',
    audioPath,
  ]);
}

async function runWhisper({
  artifactDir,
  whisperCommand,
  execFileImpl,
  audioPath,
  language,
  whisperModel,
}) {
  await execFileImpl(whisperCommand, [
    audioPath,
    '--model',
    whisperModel,
    '--language',
    language,
    '--task',
    'transcribe',
    '--output_dir',
    artifactDir,
    '--output_format',
    'txt',
    '--verbose',
    'False',
  ]);

  const expectedPath = join(artifactDir, `${basename(audioPath, extname(audioPath))}.txt`);
  if (!(await fileExists(expectedPath))) {
    throw new Error('Whisper finished but transcript txt was not found');
  }
  return expectedPath;
}

async function writeTranscriptFiles({ rawPath, cleanPath, rawText, cleanText }) {
  await writeFile(rawPath, `${rawText.trim()}\n`, 'utf8');
  await writeFile(cleanPath, `${cleanText.trim()}\n`, 'utf8');
}

export function normalizeSubtitleText(text) {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .replace(/^\d+\s*$/gm, '')
    .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[.,]\d{3}\s*$/gm, '')
    .replace(/^\d{2}:\d{2}[.:]\d{2,3}\s+-->\s+\d{2}:\d{2}[.:]\d{2,3}\s*$/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/ *\n */g, '\n')
    .trim();
}

export function cleanTranscript(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}
