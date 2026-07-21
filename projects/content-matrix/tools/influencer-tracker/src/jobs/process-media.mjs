import { dirname, resolve } from 'node:path';
import { refineMediaText } from './refine-media.mjs';
import { transcribeLocalMedia } from './transcribe-media.mjs';

export async function processLocalMedia({
  inputPath,
  outputDir,
  sourceLabel = null,
  model = 'base',
  language = 'zh',
  transcribe = transcribeLocalMedia,
  refine = refineMediaText,
  transcribeOptions = {},
}) {
  const transcription = await transcribe({
    inputPath: resolve(inputPath),
    outputDir: resolve(outputDir),
    sourceLabel,
    model,
    language,
    ...transcribeOptions,
  });
  const refinement = await refine({
    inputPath: transcription.subtitlePath,
    outputDir: dirname(transcription.subtitlePath),
    sourceLabel: transcription.sourceLabel,
  });

  return {
    status: 'ok',
    sourceLabel: transcription.sourceLabel,
    inputPath: transcription.inputPath,
    audioPath: transcription.audioPath,
    subtitlePath: transcription.subtitlePath,
    originalTranscriptPath: refinement.originalPath,
    refinedTextPath: refinement.refinedPath,
    transcriptionManifestPath: transcription.manifestPath,
    refinementManifestPath: refinement.manifestPath,
  };
}
