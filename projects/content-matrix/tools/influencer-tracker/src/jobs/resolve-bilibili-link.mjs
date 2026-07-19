const BILIBILI_RSS_BASE = 'https://rsshub.app/bilibili/user/video';

export async function resolveBilibiliLink(link, { fetchImpl = globalThis.fetch } = {}) {
  const finalUrl = await resolveFinalUrl(extractUrlFromText(link), { fetchImpl });
  const kind = classifyBilibiliUrl(finalUrl);

  if (kind === 'creator') {
    const uid = extractBilibiliUid(finalUrl);
    return {
      kind,
      inputUrl: link,
      finalUrl,
      platform: 'bilibili',
      externalId: uid,
      homepageUrl: `https://space.bilibili.com/${uid}`,
      sourceKind: 'rss',
      sourcePath: `${BILIBILI_RSS_BASE}/${uid}`,
    };
  }

  if (kind === 'content') {
    const bv = extractBilibiliVideoId(finalUrl);
    return {
      kind,
      inputUrl: link,
      finalUrl,
      platform: 'bilibili',
      externalId: bv,
      content: {
        platform: 'bilibili',
        creatorName: '随机发现',
        externalId: bv,
        url: finalUrl,
        title: `B站随机发现内容 ${bv}`,
        description: '由飞书链接解析自动导入，需人工补充标题和说明。',
        contentType: '视频',
        referenceReason: '飞书博主账号表中粘贴的是单条视频链接，先作为内容参考入库。',
      },
    };
  }

  return {
    kind: 'unknown',
    inputUrl: link,
    finalUrl,
  };
}

export async function resolveFinalUrl(link, { fetchImpl = globalThis.fetch } = {}) {
  const response = await fetchImpl(link, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'user-agent': 'MindSyncInfluencerTracker/0.1 (+https://github.com/MindSyncHub)',
    },
  });
  return response.url || link;
}

export function extractUrlFromText(value) {
  const text = String(value ?? '').trim();
  const markdown = text.match(/\((https?:\/\/[^)]+)\)/);
  if (markdown) {
    return markdown[1];
  }
  const plain = text.match(/https?:\/\/[^\s，。；、）)\],]+/);
  if (plain) {
    return plain[0].replace(/[)\],，。]+$/, '');
  }
  return text;
}

export function normalizeBilibiliUid(value) {
  const text = String(value ?? '').trim();
  const match = text.match(/(?:UID\s*[:：]\s*)?(\d+)/i);
  return match ? match[1] : text;
}

export function classifyBilibiliUrl(url) {
  const parsed = new URL(url);
  if (parsed.hostname === 'space.bilibili.com' && /^\/\d+/.test(parsed.pathname)) {
    return 'creator';
  }
  if (parsed.hostname.endsWith('bilibili.com') && /\/video\/(BV[a-zA-Z0-9]+|av\d+)/i.test(parsed.pathname)) {
    return 'content';
  }
  return 'unknown';
}

export function extractBilibiliUid(url) {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/\/(\d+)/i);
  if (!match) {
    throw new Error(`Cannot extract Bilibili UID from URL: ${url}`);
  }
  return match[1];
}

export function extractBilibiliVideoId(url) {
  const match = url.match(/\/video\/(BV[a-zA-Z0-9]+|av\d+)/i);
  if (!match) {
    throw new Error(`Cannot extract Bilibili video id from URL: ${url}`);
  }
  return match[1];
}

export function extractBilibiliVideoReferences(value) {
  const text = String(value ?? '');
  const refs = [];
  const seen = new Set();
  const pattern = /(https?:\/\/[^\s，。；、）)\],]+)|\b(BV[a-zA-Z0-9]+|av\d+)\b/gi;
  for (const match of text.matchAll(pattern)) {
    const raw = match[1] ?? match[2];
    const videoId = extractVideoIdFromReference(raw);
    if (!videoId || seen.has(videoId)) {
      continue;
    }
    seen.add(videoId);
    refs.push({
      raw,
      videoId,
      url: raw.startsWith('http') ? raw : `https://www.bilibili.com/video/${videoId}`,
    });
  }
  return refs;
}

export function buildBilibiliReferenceContent({ videoId, url, creatorName = '随机发现' }) {
  return {
    platform: 'bilibili',
    creatorName,
    externalId: videoId,
    url,
    title: `B站随机发现内容 ${videoId}`,
    description: '由飞书 BV/链接列表自动导入，需人工补充标题和说明。',
    contentType: '视频',
    referenceReason: '飞书中粘贴的是 B站视频链接或 BV 列表，先作为内容参考入库。',
  };
}

function extractVideoIdFromReference(value) {
  const text = String(value ?? '');
  const direct = text.match(/\b(BV[a-zA-Z0-9]+|av\d+)\b/i);
  return direct ? direct[1] : null;
}
