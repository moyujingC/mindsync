import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';

const execFile = promisify(execFileCallback);

export async function fetchBilibiliContentsWithYtDlp(creator, {
  limit = 20,
  bin = 'yt-dlp',
  execFileImpl = execFile,
} = {}) {
  const uid = creator.externalId;
  if (!uid) {
    throw new Error('Missing Bilibili UID for yt-dlp fallback');
  }

  const { stdout } = await execFileImpl(bin, [
    '--no-warnings',
    '--flat-playlist',
    '--dump-json',
    '--playlist-end',
    String(limit),
    `https://space.bilibili.com/${uid}`,
  ]);

  return parseYtDlpFlatPlaylist(stdout)
    .map((item) => normalizeYtDlpFlatItem(item, creator));
}

export function parseYtDlpFlatPlaylist(stdout) {
  return String(stdout ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((item) => item.id || item.url || item.webpage_url);
}

function normalizeYtDlpFlatItem(item, creator) {
  const externalId = item.id ?? extractBilibiliContentId(item.url ?? item.webpage_url);
  const url = item.webpage_url ?? item.url ?? `https://www.bilibili.com/video/${externalId}`;
  return {
    platform: 'bilibili',
    creatorExternalId: creator.externalId,
    creatorName: creator.name,
    contentExternalId: externalId,
    uniqueKey: `bilibili:${externalId}`,
    url,
    title: item.title ?? `B站视频 ${externalId}`,
    description: '',
    publishedAt: null,
    contentType: 'video',
    tags: [],
    metrics: {
      likeCount: null,
      commentCount: null,
      favoriteCount: null,
      shareCount: null,
    },
    raw: {
      source: 'yt-dlp-flat-playlist',
      item,
    },
  };
}

function extractBilibiliContentId(value) {
  const match = String(value ?? '').match(/BV[a-zA-Z0-9]+|av\d+/i);
  return match ? match[0] : String(value ?? 'unknown');
}
