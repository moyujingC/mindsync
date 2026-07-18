import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_RSSHUB_BASE_URL = 'https://rsshub.app';

export async function fetchBilibiliContents(creator, options = {}) {
  const xml = await loadRssXml(creator, options);
  const items = parseRssItems(xml);
  return items.map((item) => normalizeBilibiliRssItem(item, creator));
}

async function loadRssXml(creator, options) {
  if (creator.source?.kind === 'rss-file') {
    const filePath = resolve(options.cwd ?? process.cwd(), creator.source.path);
    return readFile(filePath, 'utf8');
  }

  const sourceUrl = creator.source?.url ?? buildBilibiliRssUrl(creator.externalId, options);
  const response = await fetchRss(sourceUrl, options.signal);

  if (!response.ok) {
    throw new Error(`Bilibili RSS request failed: ${response.status} ${response.statusText}; url=${sourceUrl}`);
  }

  return response.text();
}

async function fetchRss(sourceUrl, signal) {
  try {
    return await fetch(sourceUrl, {
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

function buildBilibiliRssUrl(externalId, options) {
  const baseUrl = options.rsshubBaseUrl ?? DEFAULT_RSSHUB_BASE_URL;
  return `${baseUrl.replace(/\/$/, '')}/bilibili/user/video/${encodeURIComponent(externalId)}`;
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
};
