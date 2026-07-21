const PLATFORM_HOSTS = {
  xiaohongshu: ['xiaohongshu.com', 'xhslink.com'],
  douyin: ['douyin.com', 'iesdouyin.com', 'v.douyin.com'],
  wechat_mp: ['mp.weixin.qq.com'],
  wechat_channels: ['channels.weixin.qq.com', 'finder.video.qq.com'],
};

const MAX_REDIRECTS = 5;

export async function resolveContentLink({ url, fetchImpl = globalThis.fetch, maxRedirects = MAX_REDIRECTS } = {}) {
  const originalUrl = parsePublicPlatformUrl(url);
  const direct = describeContentLink({ originalUrl, finalUrl: originalUrl });
  if (direct.kind !== 'unknown') {
    return direct;
  }
  let currentUrl = originalUrl;
  const redirects = [];

  for (let index = 0; index <= maxRedirects; index += 1) {
    const response = await fetchImpl(currentUrl, { method: 'GET', redirect: 'manual' });
    if (!isRedirect(response.status)) {
      return describeContentLink({ originalUrl, finalUrl: currentUrl, redirects });
    }
    const location = response.headers.get('location');
    if (!location) {
      throw new Error(`Short link returned ${response.status} without a redirect location`);
    }
    if (index === maxRedirects) {
      throw new Error(`Short link exceeded ${maxRedirects} redirects`);
    }
    const nextUrl = new URL(location, currentUrl);
    assertPublicPlatformHost(nextUrl);
    redirects.push(nextUrl.toString());
    currentUrl = nextUrl;
  }

  throw new Error('Short link resolution failed unexpectedly');
}

export async function resolveDetailContentLink(options) {
  const resolved = await resolveContentLink(options);
  if (resolved.kind !== 'content') {
    throw new Error(`Link resolves to a ${resolved.kind}, not a content detail: ${resolved.finalUrl}`);
  }
  return resolved;
}

export function describeContentLink({ originalUrl, finalUrl, redirects = [] }) {
  const final = parsePublicPlatformUrl(finalUrl);
  const platform = platformForHost(final.hostname);
  if (!platform) {
    throw new Error(`Unsupported platform link: ${final.hostname}`);
  }
  const description = describePlatformPath({ platform, url: final });
  return {
    originalUrl: originalUrl.toString(),
    finalUrl: final.toString(),
    redirects,
    platform,
    ...description,
  };
}

function describePlatformPath({ platform, url }) {
  const path = url.pathname.replace(/\/+$/, '');
  if (platform === 'xiaohongshu') {
    const contentId = path.match(/\/(?:explore|discovery\/item)\/([^/?#]+)/)?.[1];
    if (contentId) return { kind: 'content', contentId };
    if (/\/user\/profile\//.test(path)) return { kind: 'creator', contentId: null };
  }
  if (platform === 'douyin') {
    const contentId = path.match(/\/(?:video|share\/video)\/(\d+)/)?.[1];
    if (contentId) return { kind: 'content', contentId };
    if (/\/user\//.test(path)) return { kind: 'creator', contentId: null };
  }
  if (platform === 'wechat_mp') {
    if (path === '/s' && url.searchParams.has('__biz') && url.searchParams.has('mid')) {
      return { kind: 'content', contentId: url.searchParams.get('mid') };
    }
  }
  if (platform === 'wechat_channels') {
    const contentId = url.searchParams.get('object_id') ?? path.match(/\/(\d{8,})(?:\/)?$/)?.[1];
    if (contentId) return { kind: 'content', contentId };
    if (/\/finder\//.test(path)) return { kind: 'creator', contentId: null };
  }
  return { kind: 'unknown', contentId: null };
}

function parsePublicPlatformUrl(value) {
  if (value instanceof URL) {
    assertPublicPlatformHost(value);
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Missing content link');
  }
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error('Content link must be an absolute http or https URL');
  }
  assertPublicPlatformHost(parsed);
  return parsed;
}

function assertPublicPlatformHost(url) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Content link must use http or https');
  }
  if (!platformForHost(url.hostname)) {
    throw new Error(`Unsupported or unsafe link host: ${url.hostname}`);
  }
}

function platformForHost(hostname) {
  const host = hostname.toLowerCase();
  for (const [platform, domains] of Object.entries(PLATFORM_HOSTS)) {
    if (domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return platform;
    }
  }
  return null;
}

function isRedirect(status) {
  return status >= 300 && status < 400;
}
