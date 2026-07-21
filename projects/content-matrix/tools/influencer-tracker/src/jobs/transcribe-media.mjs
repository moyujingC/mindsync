import { access, mkdir, rename } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { basename, extname, join, resolve } from 'node:path';
import { writeJobManifest } from '../utils/manifest.mjs';

const MEDIA_EXTENSIONS = new Set([
  '.aac', '.avi', '.flac', '.m4a', '.mkv', '.mov', '.mp3', '.mp4', '.ogg', '.opus', '.wav', '.webm',
]);

export async function transcribeLocalMedia({
  inputPath,
  outputDir,
  sourceLabel = null,
  model = 'base',
  language = 'zh',
  ffmpegPath = 'ffmpeg',
  whisperPath = 'whisper',
  runCommand = runLocalCommand,
}) {
  if (!isSupportedMediaPath(inputPath)) {
    throw new Error(`Local transcription supports local audio or video files: ${[...MEDIA_EXTENSIONS].join(', ')}`);
  }
  const resolvedInputPath = resolve(inputPath);
  const extension = extname(resolvedInputPath).toLowerCase();

  const resolvedOutputDir = resolve(outputDir);
  const baseName = basename(resolvedInputPath, extension);
  const artifactDir = join(resolvedOutputDir, baseName);
  const audioPath = join(artifactDir, `${baseName}.audio.wav`);
  const generatedSubtitlePath = join(artifactDir, `${baseName}.audio.srt`);
  const subtitlePath = join(artifactDir, `${baseName}.srt`);
  const manifestPath = join(artifactDir, 'transcribe-media-manifest.json');
  const input = {
    inputPath: resolvedInputPath,
    sourceLabel: sourceLabel ?? baseName,
    model,
    language,
    tools: { ffmpegPath, whisperPath },
  };

  await access(resolvedInputPath);
  await mkdir(artifactDir, { recursive: true });

  try {
    await runCommand(ffmpegPath, [
      '-y', '-i', resolvedInputPath, '-vn', '-ac', '1', '-ar', '16000', audioPath,
    ]);
    await runCommand(whisperPath, [
      audioPath,
      '--model', model,
      '--language', language,
      '--task', 'transcribe',
      '--output_format', 'srt',
      '--output_dir', artifactDir,
      '--verbose', 'False',
    ]);
    await access(generatedSubtitlePath);
    await rename(generatedSubtitlePath, subtitlePath);

    const result = {
      status: 'ok',
      sourceLabel: input.sourceLabel,
      inputPath: resolvedInputPath,
      audioPath,
      subtitlePath,
      artifactDir,
      model,
      language,
    };
    await writeJobManifest({
      manifestPath,
      job: 'transcribe-media',
      status: 'ok',
      input,
      output: result,
    });
    return { ...result, manifestPath };
  } catch (error) {
    await writeJobManifest({
      manifestPath,
      job: 'transcribe-media',
      status: 'failed',
      input,
      error,
    });
    throw error;
  }
}

export function isSupportedMediaPath(inputPath) {
  const value = String(inputPath);
  return !/^https?:\/\//i.test(value) && MEDIA_EXTENSIONS.has(extname(value).toLowerCase());
}

export function runLocalCommand(command, args) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', (error) => {
      rejectCommand(new Error(`Unable to run ${command}: ${error.message}`));
    });
    child.once('close', (code) => {
      if (code === 0) {
        resolveCommand();
        return;
      }
      rejectCommand(new Error(`${command} exited with code ${code}${stderr ? `: ${stderr.trim()}` : ''}`));
    });
  });
}
