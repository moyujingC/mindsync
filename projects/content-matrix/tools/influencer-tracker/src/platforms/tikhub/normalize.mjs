export function normalizeTikHubContent({ platform, data }) {
  const source = unwrapContent(data);
  const externalId = requiredString(first(source.aweme_id, source.note_id, source.id, source.item_id, source.object_id, source.url), 'TikHub content ID');
  const creator = first(source.author, source.user, source.user_info, {});
  const metrics = first(source.statistics, source.interact_info, source.interaction, {});
  const description = first(source.desc, source.description, source.content, source.note_desc, '');
  return {
    uniqueKey: `${platform}:${externalId}`,
    platform,
    creatorName: first(creator.nickname, creator.name, creator.user_name, source.author_name, '未知博主'),
    creatorExternalId: first(creator.sec_uid, creator.user_id, creator.uid, creator.id, null),
    contentExternalId: externalId,
    url: first(source.share_url, source.url, source.note_url, source.link, null),
    title: first(source.title, source.note_title, description.slice(0, 60), `${platform} 内容 ${externalId}`),
    description,
    publishedAt: normalizeTimestamp(first(source.create_time, source.time, source.publish_time, source.publish_date, null)),
    contentType: normalizeContentType(platform, source),
    tags: normalizeTags(first(source.tags, source.tag_list, [])),
    metrics: {
      likeCount: toNumber(first(metrics.digg_count, metrics.liked_count, metrics.like_count, source.like_count, 0)),
      commentCount: toNumber(first(metrics.comment_count, source.comment_count, 0)),
      favoriteCount: toNumber(first(metrics.collect_count, metrics.collected_count, metrics.favorite_count, source.favorite_count, 0)),
      shareCount: toNumber(first(metrics.share_count, source.share_count, 0)),
    },
    raw: source,
  };
}

export function normalizeTikHubComments({ platform, contentUniqueKey, items }) {
  return unwrapItems(items).map((item, index) => {
    const commentId = requiredString(String(first(item.cid, item.comment_id, item.id, item.rpid, `${index}`)), 'TikHub comment ID');
    const user = first(item.user, item.user_info, item.member, {});
    return {
      platform,
      contentUniqueKey,
      commentUniqueKey: `${platform}:${contentUniqueKey}:${commentId}`,
      commentId,
      commentText: requiredString(first(item.text, item.content, item.message, item.content?.message, ''), 'TikHub comment text').trim(),
      commentedAt: normalizeTimestamp(first(item.create_time, item.ctime, item.time, item.created_at, null)) ?? new Date().toISOString(),
      likeCount: toNumber(first(item.digg_count, item.like_count, item.like, 0)),
      userHandle: String(first(user.nickname, user.name, user.user_id, user.uid, 'unknown')),
      demandType: [],
      sentiment: '未判断',
      insightStatus: '待定',
      raw: item,
    };
  });
}

export function extractTikHubItems(data) {
  const source = data?.data ?? data ?? {};
  return unwrapItems(first(source.comments, source.items, source.list, source.notes, source.aweme_list, source.data, []));
}

function unwrapContent(data) {
  return data?.data ?? data?.note ?? data?.aweme_detail ?? data?.aweme ?? data?.article ?? data?.object ?? data ?? {};
}

function unwrapItems(items) {
  return Array.isArray(items) ? items : first(items?.comments, items?.items, items?.data, []);
}

function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function requiredString(value, label) {
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing ${label}`);
  }
  return value;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }
  const timestamp = Number(value);
  const date = Number.isFinite(timestamp)
    ? new Date(timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeContentType(platform, source) {
  if (platform === 'wechat_mp') {
    return '文章';
  }
  if (source.type === 'normal' || source.note_type === 'image') {
    return '图文';
  }
  return '视频';
}

function normalizeTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => typeof item === 'string' ? item : first(item.name, item.tag_name, '')).filter(Boolean);
}
