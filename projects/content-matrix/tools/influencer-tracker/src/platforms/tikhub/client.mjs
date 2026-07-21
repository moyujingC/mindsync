const API_BASE = 'https://api.tikhub.io';

export class TikHubClient {
  constructor({ apiKey = process.env.TIKHUB_API_KEY, baseUrl = API_BASE, fetchImpl = globalThis.fetch } = {}) {
    this.apiKey = apiKey?.trim();
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
    this.requestCount = 0;
  }

  async getContentDetail({ platform, shareUrl, contentId = null }) {
    const route = detailRoute(platform);
    const params = shareUrl ? detailParams(platform, shareUrl) : { content_id: contentId };
    return this.request(route, { params });
  }

  async searchContents({ platform, keyword, cursor = null }) {
    return this.request(searchRoute(platform), {
      method: platform === 'douyin' ? 'POST' : 'GET',
      params: platform === 'douyin' ? null : { keyword, cursor },
      body: platform === 'douyin' ? { keyword, cursor } : null,
    });
  }

  async getCreatorContents({ platform, creatorId, cursor = null, limit = 10 }) {
    return this.request(creatorRoute(platform), {
      method: platform === 'xiaohongshu' ? 'GET' : 'POST',
      params: platform === 'xiaohongshu' ? { user_id: creatorId, cursor } : null,
      body: platform === 'xiaohongshu' ? null : { creator_id: creatorId, cursor, count: limit },
    });
  }

  async getComments({ platform, contentId, cursor = null }) {
    return this.request(commentRoute(platform), {
      method: platform === 'xiaohongshu' ? 'GET' : 'POST',
      params: platform === 'xiaohongshu' ? { note_id: contentId, cursor } : null,
      body: platform === 'xiaohongshu' ? null : { content_id: contentId, cursor },
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
    const json = await response.json().catch(() => ({}));
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

function searchRoute(platform) {
  const routes = {
    xiaohongshu: '/api/v1/xiaohongshu/app_v2/search_notes',
    douyin: '/api/v1/douyin/search/fetch_general_search_v1',
    wechat_mp: '/api/v1/wechat_search/v2/fetch_search',
    wechat_channels: '/api/v1/wechat_search/v2/fetch_search',
  };
  return requiredRoute(routes, platform, 'search');
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
