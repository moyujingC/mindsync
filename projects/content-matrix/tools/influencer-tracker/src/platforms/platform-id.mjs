const PLATFORM_ALIASES = {
  xiaohongshu: 'xiaohongshu',
  '小红书': 'xiaohongshu',
  douyin: 'douyin',
  '抖音': 'douyin',
  wechat_mp: 'wechat_mp',
  '公众号': 'wechat_mp',
  wechat_channels: 'wechat_channels',
  '视频号': 'wechat_channels',
};

const PLATFORM_LABELS = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  wechat_mp: '公众号',
  wechat_channels: '视频号',
};

export function normalizePlatformId(value, label = 'platform') {
  const normalized = PLATFORM_ALIASES[String(value ?? '').trim()];
  if (!normalized) {
    throw new Error(`Unsupported ${label}: ${value}. Use 小红书 / 抖音 / 公众号 / 视频号 or a TikHub platform ID.`);
  }
  return normalized;
}

export function platformLabel(value) {
  const platform = normalizePlatformId(value);
  return PLATFORM_LABELS[platform];
}

export function contentKeyAliases({ platform, externalId }) {
  const normalizedPlatform = normalizePlatformId(platform);
  const label = PLATFORM_LABELS[normalizedPlatform];
  return new Set([`${normalizedPlatform}:${externalId}`, `${label}:${externalId}`]);
}
