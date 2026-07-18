import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fetchBilibiliContentsWithYtDlp } from './yt-dlp.mjs';

const DEFAULT_RSSHUB_BASE_URL = 'https://rsshub.app';
const RSSHUB_ENV = 'RSSHUB_BASE_URLS';

export async function fetchBilibiliContents(creator, options = {}) {
  try {
    const xml = await loadRssXml(creator, options);
    const items = parseRssItems(xml);
    return items.map((item) => normalizeBilibiliRssItem(item, creator));
  } catch (error) {
    if (!shouldUseYtDlpFallback(options)) {
      throw error;
    }
    try {
      return await fetchBilibiliContentsWithYtDlp(creator, {
        limit: options.platformConfig?.ytDlpLimit ?? options.ytDlpLimit ?? Math.min(options.limit ?? options.limitPerCreator ?? 5, 5),
        bin: options.platformConfig?.ytDlpBin ?? options.ytDlpBin,
        execFileImpl: options.execFileImpl,
      });
    } catch (fallbackError) {
      throw new Error(`${error.message} | Bilibili yt-dlp fallback failed: ${fallbackError.message}`);
    }
  }
}

async function loadRssXml(creator, options) {
  if (creator.source?.kind === 'rss-file') {
    const filePath = resolve(options.cwd ?? process.cwd(), creator.source.path);
    return readFile(filePath, 'utf8');
  }

  const sourceUrls = buildBilibiliRssUrls(creator, options);
  const response = await fetchFirstRss(sourceUrls, {
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  });

  return response.text();
}

async function fetchRss(sourceUrl, { signal, fetchImpl = globalThis.fetch } = {}) {
  try {
    return await fetchImpl(sourceUrl, {
      headers: {
        'user-agent': 'MindSyncInfluencerTracker/0.1 (+https://github.com/MindSyncHub)',
      },
      signal,
    });
  } catch (error) {
    const reason = error.cause?.code ?? error.message;
    throw new Error(`Bilibili RSS request failed: network error; url=${sourceUrl}; reason=${reason}`);
  }
}

async function fetchFirstRss(sourceUrls, options = {}) {
  const errors = [];
  for (const sourceUrl of sourceUrls) {
    try {
      const response = await fetchRss(sourceUrl, options);
      if (response.ok) {
        return response;
      }
      errors.push(`Bilibili RSS request failed: ${response.status} ${response.statusText}; url=${sourceUrl}`);
    } catch (error) {
      errors.push(error.message);
    }
  }
  throw new Error(errors.join(' | '));
}

function buildBilibiliRssUrls(creator, options) {
  if (creator.source?.url) {
    if (options.disableRsshubExpansion) {
      return [creator.source.url];
    }
    return expandConfiguredRssUrl(creator.source.url, options);
  }

  return resolveRsshubBaseUrls(options).map((baseUrl) => buildBilibiliRssUrl({
    baseUrl,
    externalId: creator.externalId,
  }));
}

function expandConfiguredRssUrl(sourceUrl, options) {
  const parsed = parseRsshubBilibiliUrl(sourceUrl);
  if (!parsed) {
    return [sourceUrl];
  }
  return resolveRsshubBaseUrls(options).map((baseUrl) => buildBilibiliRssUrl({
    baseUrl,
    externalId: parsed.externalId,
  }));
}

function parseRsshubBilibiliUrl(sourceUrl) {
  try {
    const parsed = new URL(sourceUrl);
    const match = parsed.pathname.match(/^\/bilibili\/user\/video\/([^/]+)/);
    if (!match) {
      return null;
    }
    return {
      baseUrl: parsed.origin,
      externalId: decodeURIComponent(match[1]),
    };
  } catch {
    return null;
  }
}

function buildBilibiliRssUrl({ baseUrl, externalId }) {
  return `${baseUrl.replace(/\/$/, '')}/bilibili/user/video/${encodeURIComponent(externalId)}`;
}

function resolveRsshubBaseUrls(options = {}) {
  const configured = options.rsshubBaseUrls
    ?? options.platformConfig?.rsshubBaseUrls
    ?? options.platformConfig?.rsshubBaseUrl
    ?? options.rsshubBaseUrl;
  const fromConfig = Array.isArray(configured) ? configured : String(configured ?? '').split(',');
  const fromEnv = String(process.env[RSSHUB_ENV] ?? '').split(',');
  const candidates = [...fromConfig, ...fromEnv, DEFAULT_RSSHUB_BASE_URL]
    .map((value) => String(value).trim())
    .filter(Boolean);
  return [...new Set(candidates)];
}

function shouldUseYtDlpFallback(options = {}) {
  return Boolean(
    options.ytDlpFallback
    || options.platformConfig?.ytDlpFallback
    || process.env.BILIBILI_YTDLP_FALLBACK === '1',
  );
}

function parseRssItems(xml) {
  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
  return itemBlocks.map((block) => ({
    title: extractTag(block, 'title'),
    link: extractTag(block, 'link'),
    guid: extractTag(block, 'guid'),
    pubDate: extractTag(block, 'pubDate'),
    description: stripHtml(extractTag(block, 'description')),
  }));
}

function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`));
  if (!match) {
    return '';
  }
  return decodeXml(match[1].trim().replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, ''));
}

function stripHtml(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function normalizeBilibiliRssItem(item, creator) {
  const externalId = extractBilibiliContentId(item.link || item.guid);
  return {
    platform: 'bilibili',
    creatorExternalId: creator.externalId,
    creatorName: creator.name,
    contentExternalId: externalId,
    uniqueKey: `bilibili:${externalId}`,
    url: item.link || item.guid,
    title: item.title || '(无标题)',
    description: item.description,
    publishedAt: normalizeDate(item.pubDate),
    contentType: 'video',
    tags: [],
    metrics: {
      likeCount: null,
      commentCount: null,
      favoriteCount: null,
      shareCount: null,
    },
    raw: {
      source: 'rss',
      guid: item.guid,
    },
  };
}

function extractBilibiliContentId(value) {
  if (!value) {
    return `unknown-${Date.now()}`;
  }
  const bv = value.match(/BV[a-zA-Z0-9]+/);
  if (bv) {
    return bv[0];
  }
  const av = value.match(/av(\d+)/i);
  if (av) {
    return `av${av[1]}`;
  }
  return value.split('/').filter(Boolean).at(-1)?.split('?')[0] ?? value;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export const internals = {
  parseRssItems,
  normalizeBilibiliRssItem,
  fetchRss,
  fetchFirstRss,
  buildBilibiliRssUrls,
  resolveRsshubBaseUrls,
  parseRsshubBilibiliUrl,
  shouldUseYtDlpFallback,
};
