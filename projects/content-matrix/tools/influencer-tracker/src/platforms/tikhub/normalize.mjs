import { normalizePlatformId } from '../platform-id.mjs';

export function normalizeTikHubContent({ platform, data }) {
  platform = normalizePlatformId(platform, 'TikHub content platform');
  const source = unwrapContent(data);
  const externalId = requiredString(first(source.aweme_id, source.note_id, source.docID, source.doc_id, source.msgId, source.id, source.item_id, source.object_id, source.comment_id, source.url), 'TikHub content ID');
  const creator = first(source.author, source.user, source.user_info, source.contact, {});
  const metrics = first(source.statistics, source.interact_info, source.interaction, {});
  const description = stripMarkup(firstString(
    source.desc, source.description, source.content, source.note_desc,
    source.objectDesc?.description, source.objectDesc?.shortTitle, source.objectExtend?.feedTitle,
  ) ?? '');
  return {
    uniqueKey: `${platform}:${externalId}`,
    platform,
    creatorName: first(creator.nickname, creator.name, creator.user_name, source.nickname, source.nick_name, source.source?.title, source.author_name, '未知博主'),
    creatorExternalId: first(creator.sec_uid, creator.user_id, creator.userid, creator.uid, creator.id, source.user_name, source.username, source._tikhubCreatorId, null),
    contentExternalId: externalId,
    url: sanitizeContentUrl(first(source.share_url, source.url, source.note_url, source.link, source.doc_url, null), platform),
    title: stripMarkup(first(source.title, source.note_title, source.objectDesc?.shortTitle, source.objectExtend?.feedTitle, description.slice(0, 60), `${platform} 内容 ${externalId}`)),
    description,
    publishedAt: normalizeTimestamp(first(source.create_time, source.createtime, source.time, source.publish_time, source.publish_date, source.pubTime, source.date, null)),
    contentType: normalizeContentType(platform, source),
    tags: normalizeTags(first(source.tags, source.tag_list, [])),
    metrics: {
      likeCount: toNumber(first(metrics.digg_count, metrics.liked_count, metrics.like_count, source.liked_count, source.like_count, source.likeCount, source.likeNum, 0)),
      commentCount: toNumber(first(metrics.comment_count, metrics.comments_count, source.comments_count, source.comment_count, source.commentCount, 0)),
      favoriteCount: toNumber(first(metrics.collect_count, metrics.collected_count, metrics.favorite_count, source.collected_count, source.favorite_count, 0)),
      shareCount: toNumber(first(metrics.share_count, source.shared_count, source.share_count, 0)),
    },
    raw: source,
  };
}

export function normalizeTikHubComments({ platform, contentUniqueKey, items }) {
  platform = normalizePlatformId(platform, 'TikHub comment platform');
  return unwrapItems(items).map((item, index) => {
    const commentId = requiredString(String(first(item.cid, item.comment_id, item.commentId, item.id, item.rpid, `${index}`)), 'TikHub comment ID');
    const user = first(item.user, item.user_info, item.member, item.authorContact, {});
    return {
      platform,
      contentUniqueKey,
      commentUniqueKey: `${platform}:${contentUniqueKey}:${commentId}`,
      commentId,
      commentText: requiredString(first(item.text, item.content, item.message, item.content?.message, ''), 'TikHub comment text').trim(),
      commentedAt: normalizeTimestamp(first(item.create_time, item.createtime, item.ctime, item.time, item.created_at, null)) ?? new Date().toISOString(),
      likeCount: toNumber(first(item.digg_count, item.like_count, item.likeCount, item.like_num, item.like, 0)),
      userHandle: String(first(user.nickname, user.name, user.user_id, user.uid, item.nickname, item.nick_name, 'unknown')),
      demandType: [],
      sentiment: '未判断',
      insightStatus: '待定',
      raw: item,
    };
  });
}

export function extractTikHubItems(data) {
  return extractTikHubPage(data).items;
}

export function extractTikHubPage(data) {
  const envelope = data ?? {};
  const source = envelope.data ?? envelope;
  const rawItems = Array.isArray(source) ? source : unwrapItems(first(
    source.comments,
    source.items,
    source.list,
    source.notes,
    source.aweme_list,
    source.article_list,
    source.articles,
    source.video_list,
    source.object,
    source.commentInfo,
    source.data?.[0]?.note_list,
    source.data?.notes,
    source.results?.data,
    source.data,
    [],
  ));
  const items = flattenSearchItems(rawItems).map((item) => source.biz_username && item?.appMsg
    ? { ...item, _tikhubCreatorId: source.biz_username }
    : item);
  const cursor = [
    source.next_cursor, source.nextCursor, source.cursor, source.max_cursor, source.maxCursor, source.next_page,
    source.next_offset,
    source.lastBuffer, source.last_buffer,
    source.data?.cursor, source.data?.next_cursor, source.data?.nextCursor,
    source.notes?.[0]?.cursor,
    source.results?.cursor, source.results?.next_cursor, source.results?.nextCursor,
    envelope.next_cursor, envelope.nextCursor, envelope.cursor, envelope.max_cursor, envelope.maxCursor, envelope.next_page,
  ]
    .find((value) => value !== undefined && value !== null && value !== '');
  return {
    items,
    cursor: cursor === undefined ? null : String(cursor),
    hasMore: normalizeHasMore(first(
      source.has_more, source.hasMore, source.more, source.continueFlag, source.upContinueFlag, source.downContinueFlag,
      source.data?.has_more, source.data?.hasMore,
      source.results?.continue_flag, source.results?.continueFlag, envelope.has_more, envelope.hasMore, envelope.more,
    ) ?? (source.is_end === 0)),
  };
}

function unwrapContent(data) {
  if (Array.isArray(data?.objects) && data.objects.length > 0) {
    const object = data.objects[0];
    return {
      ...object,
      author: object.contact,
      username: first(object.username, object.contact?.username),
      description: firstString(object.objectDesc?.description, object.objectDesc?.shortTitle, object.objectExtend?.feedTitle),
      title: firstString(object.objectDesc?.shortTitle, object.objectExtend?.feedTitle, object.objectDesc?.description),
    };
  }
  if (data?.appMsg && typeof data.appMsg === 'object') {
    const detail = data.appMsg.detailInfo?.[0] ?? {};
    return {
      ...data,
      ...detail,
      msgId: first(data.baseInfo?.msgId, data.appMsg.baseInfo?.appMsgId),
      create_time: first(detail.createTime, data.appMsg.baseInfo?.createTime, data.baseInfo?.dateTime),
      url: first(detail.contentUrl, detail.sourceUrl),
      title: first(detail.title, detail.textTitle),
      desc: firstString(detail.digest, detail.showDesc),
    };
  }
  if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
    // WeChat MP keeps IDs and canonical URLs at the root, with article metadata under content.
    return { ...data, ...data.content };
  }
  return data?.aweme_info
    ?? data?.data?.[0]?.note_list?.[0]
    ?? data?.data?.note
    ?? data?.note
    ?? data?.data?.aweme_detail
    ?? data?.data?.aweme
    ?? data?.data?.article
    ?? data?.data?.object
    ?? data?.data
    ?? data?.aweme_detail
    ?? data?.aweme
    ?? data?.article
    ?? data?.object
    ?? data
    ?? {};
}

function unwrapItems(items) {
  return Array.isArray(items) ? items : first(items?.comments, items?.commentInfo, items?.items, items?.articles, items?.object, items?.data, []);
}

function flattenSearchItems(items) {
  return items.flatMap((item) => {
    if (Array.isArray(item?.items)) {
      return flattenSearchItems(item.items);
    }
    if (Array.isArray(item?.subBoxes)) {
      return flattenSearchItems(item.subBoxes);
    }
    return [item];
  });
}

function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value !== '');
}

function requiredString(value, label) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing ${label}`);
  }
  return String(value);
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

function normalizeHasMore(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function normalizeTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => typeof item === 'string' ? item : first(item.name, item.tag_name, '')).filter(Boolean);
}

function sanitizeContentUrl(value, platform) {
  if (!value || typeof value !== 'string') {
    return value ?? null;
  }
  try {
    const url = new URL(value);
    if (platform === 'wechat_mp' && /(^|\.)mp\.weixin\.qq\.com$/i.test(url.hostname)) {
      // These query fields identify a public article; stripping them makes the link unusable for detail/comment collection.
      return `${url.origin}${url.pathname}${url.search}`;
    }
    return `${url.origin}${url.pathname}`;
  } catch {
    return value;
  }
}

function stripMarkup(value) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value;
}
