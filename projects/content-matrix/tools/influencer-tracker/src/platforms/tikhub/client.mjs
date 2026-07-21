const API_BASE = 'https://api.tikhub.io';

export class TikHubClient {
  constructor({ apiKey = process.env.TIKHUB_API_KEY, baseUrl = API_BASE, fetchImpl = globalThis.fetch, onResponse = null } = {}) {
    this.apiKey = apiKey?.trim();
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
    this.onResponse = onResponse;
    this.requestCount = 0;
  }

  async getContentDetail({ platform, shareUrl, contentId = null }) {
    const route = detailRoute(platform);
    if (platform === 'wechat_mp') {
      if (!shareUrl) {
        throw new Error('TikHub WeChat MP detail requires an article shareUrl');
      }
      return this.request(route, { method: 'POST', body: { url: shareUrl, raw: true } });
    }
    if (platform === 'wechat_channels') {
      return this.request(route, {
        method: 'POST',
        body: wechatChannelsDetailBody({ shareUrl, contentId }),
      });
    }
    const params = shareUrl ? detailParams(platform, shareUrl) : { content_id: contentId };
    return this.request(route, { params });
  }

  async searchContents({ platform, keyword, cursor = null }) {
    const isWechatSearch = platform === 'wechat_mp' || platform === 'wechat_channels';
    return this.request(searchRoute(platform), {
      method: platform === 'douyin' || isWechatSearch ? 'POST' : 'GET',
      params: platform === 'douyin' || isWechatSearch ? null : { keyword, cursor },
      body: platform === 'douyin'
        ? { keyword, cursor }
        : wechatSearchBody(platform, keyword, cursor),
    });
  }

  async getCreatorContents({ platform, creatorId, cursor = null, limit = 10 }) {
    if (platform === 'wechat_mp') {
      return this.request(creatorRoute(platform), {
        method: 'POST',
        body: { username: creatorId, page_size: Math.min(20, Math.max(10, limit)), offset: cursor, raw: true },
      });
    }
    if (platform === 'wechat_channels') {
      return this.request(creatorRoute(platform), {
        method: 'POST',
        body: { username: creatorId, last_buffer: cursor, raw: true },
      });
    }
    if (platform === 'douyin') {
      return this.request(creatorRoute(platform), {
        params: { sec_user_id: creatorId, max_cursor: cursor ?? 0, count: limit, sort_type: 0 },
      });
    }
    return this.request(creatorRoute(platform), {
      method: 'GET',
      params: { user_id: creatorId, cursor },
    });
  }

  async getComments({ platform, contentId, shareUrl = null, cursor = null }) {
    if (platform === 'wechat_mp') {
      if (!shareUrl) {
        throw new Error('TikHub WeChat MP comments require an article shareUrl');
      }
      return this.request(commentRoute(platform), {
        method: 'POST',
        body: { url: shareUrl, buffer: cursor, raw: true },
      });
    }
    if (platform === 'wechat_channels') {
      if (!/^\d+$/.test(String(contentId ?? ''))) {
        throw new Error('TikHub WeChat Channels comments require a numeric object_id');
      }
      return this.request(commentRoute(platform), {
        method: 'POST',
        body: { object_id: String(contentId), last_buffer: cursor, raw: true },
      });
    }
    if (platform === 'douyin') {
      return this.request(commentRoute(platform), {
        params: { aweme_id: contentId, cursor: cursor ?? 0, count: 20 },
      });
    }
    return this.request(commentRoute(platform), {
      params: { note_id: contentId, cursor },
    });
  }

  async request(path, { method = 'GET', params = null, body = null } = {}) {
    if (!this.apiKey) {
      throw new Error('Missing TIKHUB_API_KEY');
    }
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
    this.requestCount += 1;
    const response = await this.fetchImpl(url, {
      method,
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        accept: 'application/json',
        'content-type': 'application/json',
        'user-agent': 'content-matrix-influencer-tracker/0.2',
      },
      body: body ? JSON.stringify(removeEmpty(body)) : undefined,
    });
    const json = await readTikHubJson(response);
    await this.onResponse?.({ path, method, params, body, status: response.status, response: json });
    if (response.status === 402) {
      throw new Error('TikHub returned 402: check account balance or endpoint entitlement');
    }
    if (!response.ok || json.code !== 200) {
      throw new Error(`TikHub request failed: ${response.status} ${json.message ?? json.msg ?? 'unknown error'}`);
    }
    return {
      data: json.data,
      cacheUrl: json.cache_url ?? null,
      audit: {
        requestCount: this.requestCount,
        source: 'tikhub',
      },
    };
  }
}

async function readTikHubJson(response) {
  try {
    if (typeof response.text === 'function') {
      const text = await response.text();
      return parseTikHubJson(text);
    }
    return await response.json();
  } catch {
    return {};
  }
}

export function parseTikHubJson(text) {
  // Video IDs can exceed Number.MAX_SAFE_INTEGER. Keep large integer tokens exact for later API calls.
  return JSON.parse(quoteLargeIntegers(String(text)));
}

function quoteLargeIntegers(text) {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }
    if (/[0-9]/.test(char)) {
      const previous = text[index - 1] ?? '';
      let end = index;
      while (/[0-9]/.test(text[end + 1] ?? '')) {
        end += 1;
      }
      const token = text.slice(index, end + 1);
      const next = text[end + 1] ?? '';
      const isIntegerStart = !/[.eE-]/.test(previous);
      if (isIntegerStart && token.length >= 16 && !/[.eE]/.test(next)) {
        output += `"${token}"`;
      } else {
        output += token;
      }
      index = end;
      continue;
    }
    output += char;
  }
  return output;
}

function detailRoute(platform) {
  const routes = {
    xiaohongshu: '/api/v1/xiaohongshu/app_v2/get_image_note_detail',
    douyin: '/api/v1/douyin/app/v3/fetch_one_video_by_share_url',
    wechat_mp: '/api/v1/wechat_mp/v2/fetch_article_detail',
    wechat_channels: '/api/v1/wechat_channels/v2/fetch_video_detail',
  };
  return requiredRoute(routes, platform, 'detail');
}

function detailParams(platform, shareUrl) {
  if (platform === 'xiaohongshu') {
    return { share_text: shareUrl };
  }
  if (platform === 'wechat_mp') {
    return { url: shareUrl };
  }
  return { share_url: shareUrl };
}

function wechatChannelsDetailBody({ shareUrl, contentId }) {
  if (contentId && /^\d+$/.test(String(contentId))) {
    return { object_id: String(contentId), raw: true };
  }
  if (contentId && /^export\//.test(String(contentId))) {
    return { export_id: String(contentId), raw: true };
  }
  if (shareUrl) {
    return { share_url: shareUrl, raw: true };
  }
  throw new Error('TikHub WeChat Channels detail requires a shareUrl, numeric object_id, or export_id');
}

function searchRoute(platform) {
  const routes = {
    xiaohongshu: '/api/v1/xiaohongshu/app_v2/search_notes',
    douyin: '/api/v1/douyin/search/fetch_general_search_v1',
    wechat_mp: '/api/v1/wechat_search/v2/fetch_search',
    wechat_channels: '/api/v1/wechat_search/v2/fetch_search_videos',
  };
  return requiredRoute(routes, platform, 'search');
}

function wechatSearchBody(platform, keyword, cursor) {
  if (platform === 'wechat_mp') {
    return { keyword, business_type: 'article', cursor, offset: 0, raw: true };
  }
  if (platform === 'wechat_channels') {
    return { keyword, cursor, offset: 0, raw: true };
  }
  return null;
}

function creatorRoute(platform) {
  const routes = {
    xiaohongshu: '/api/v1/xiaohongshu/app_v2/get_user_posted_notes',
    douyin: '/api/v1/douyin/app/v3/fetch_user_post_videos',
    wechat_mp: '/api/v1/wechat_mp/v2/fetch_account_articles',
    wechat_channels: '/api/v1/wechat_channels/v2/fetch_user_videos',
  };
  return requiredRoute(routes, platform, 'creator tracking');
}

function commentRoute(platform) {
  const routes = {
    xiaohongshu: '/api/v1/xiaohongshu/app_v2/get_note_comments',
    douyin: '/api/v1/douyin/app/v3/fetch_video_comments',
    wechat_mp: '/api/v1/wechat_mp/v2/fetch_article_comments',
    wechat_channels: '/api/v1/wechat_channels/v2/fetch_video_comments',
  };
  return requiredRoute(routes, platform, 'comments');
}

function requiredRoute(routes, platform, action) {
  const route = routes[platform];
  if (!route) {
    throw new Error(`TikHub does not support ${action} for platform: ${platform}`);
  }
  return route;
}

function removeEmpty(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== null && value !== undefined && value !== ''));
}
