import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readJsonFile } from './json-file.mjs';

export async function writeJobManifest({
  manifestPath,
  job,
  status,
  input = {},
  output = {},
  legacyFields = {},
  error = null,
}) {
  const manifest = {
    version: 1,
    job,
    status,
    generatedAt: new Date().toISOString(),
    input,
    output,
    ...legacyFields,
  };

  if (error) {
    manifest.error = normalizeError(error);
  }

  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export async function listArtifactManifests(artifactDir) {
  const manifestNames = [
    'download-manifest.json',
    'transcribe-manifest.json',
    'comments-manifest.json',
    'enrich-manifest.json',
  ];

  const manifests = {};
  for (const fileName of manifestNames) {
    const filePath = join(artifactDir, fileName);
    const manifest = await readJsonFile(filePath, null);
    if (manifest) {
      manifests[fileName] = manifest;
    }
  }
  return manifests;
}

export async function summarizeManifestCoverage(downloadsRoot) {
  const artifactDirs = await listArtifactDirectories(downloadsRoot);
  const artifacts = [];

  for (const artifactDir of artifactDirs) {
    const manifests = await listArtifactManifests(artifactDir);
    artifacts.push({
      artifactDir,
      hasDownloadManifest: Boolean(manifests['download-manifest.json']),
      hasTranscribeManifest: Boolean(manifests['transcribe-manifest.json']),
      hasCommentsManifest: Boolean(manifests['comments-manifest.json']),
      hasEnrichManifest: Boolean(manifests['enrich-manifest.json']),
    });
  }

  return {
    artifactCount: artifacts.length,
    downloadCount: artifacts.filter((item) => item.hasDownloadManifest).length,
    transcribeCount: artifacts.filter((item) => item.hasTranscribeManifest).length,
    commentsCount: artifacts.filter((item) => item.hasCommentsManifest).length,
    enrichCount: artifacts.filter((item) => item.hasEnrichManifest).length,
    artifacts,
  };
}

async function listArtifactDirectories(downloadsRoot) {
  const creatorDirs = await safeReadDir(downloadsRoot);
  const artifactDirs = [];

  for (const creatorDir of creatorDirs) {
    const creatorPath = join(downloadsRoot, creatorDir);
    const contentDirs = await safeReadDir(creatorPath);
    for (const contentDir of contentDirs) {
      artifactDirs.push(join(creatorPath, contentDir));
    }
  }

  return artifactDirs.sort();
}

async function safeReadDir(dir) {
  try {
    return await readdir(dir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function normalizeError(error) {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return {
      message: error,
    };
  }
  return {
    name: error.name,
    message: error.message,
  };
}
