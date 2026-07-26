import { ContentStore } from '../storage/content-store.mjs';
import { extractFeishuTextField, mapCommentToFeishuFields, mapContentToFeishuFields, mapCreatorTaskFields, mapEngagementSnapshotToFeishuFields, toFeishuPlatform } from '../feishu/client.mjs';
import { extractTikHubPage, normalizeTikHubComments, normalizeTikHubContent } from '../platforms/tikhub/normalize.mjs';
import { contentKeyAliases, normalizePlatformId } from '../platforms/platform-id.mjs';
import { describeContentLink } from '../platforms/content-link.mjs';

const DEFAULT_LIMIT = 10;

export async function collectTikHubResearch({
  request,
  client,
  feishuClient = null,
  feishuConfig = null,
  storePath,
  dryRun = false,
}) {
  request = normalizeRequestPlatform(request);
  validateRequest(request);
  const store = new ContentStore({ filePath: storePath });
  await store.load();

  const response = await fetchContents({ request, client });
  const contents = uniqueByKey(response.items.map((item) => normalizeTikHubContent({ platform: request.platform, data: item })), 'uniqueKey')
    .filter((content) => isWithinPublishedWindow(content, request.publishedAfter));
  const remoteContentKeys = await loadRemoteKeys({ feishuClient, feishuConfig, tableName: 'contents', fieldKey: 'uniqueKey', dryRun });
  const newContents = [];
  for (const content of contents) {
    if (!await hasKnownContent({ store, remoteContentKeys, content })) {
      newContents.push(content);
    }
  }
  const duplicateCount = contents.length - newContents.length;

  const creatorResult = await syncCreators({
    request,
    contents,
    feishuClient,
    feishuConfig,
    dryRun,
  });

  if (!dryRun && feishuClient && newContents.length > 0) {
    const fields = feishuConfig.tables.contents.fields;
    await feishuClient.createRecords('contents', newContents.map((content) => mapContentToFeishuFields(content, fields)));
  }
  for (const content of newContents) {
    store.addContent(content.uniqueKey);
  }

  const snapshotResult = await syncEngagementSnapshots({
    contents, request, feishuClient, feishuConfig, dryRun,
  });

  const commentResult = await collectComments({
    request,
    client,
    // Re-running a request must be able to add newly requested comments for already known content.
    contents,
    feishuClient,
    feishuConfig,
    dryRun,
  });

  const result = {
    request: sanitizedRequest(request),
    audit: {
      source: 'tikhub',
      requestCount: commentResult.audit?.requestCount ?? response.audit?.requestCount ?? 0,
      cacheUrls: [...new Set([...response.cacheUrls, ...commentResult.cacheUrls])],
      pagination: {
        contents: response.pagination,
        comments: commentResult.pagination,
      },
    },
    creators: creatorResult,
    contents: {
      fetchedCount: contents.length,
      createdCount: newContents.length,
      duplicateCount,
      // Research candidates need the sampled content even when only its comments are new.
      items: contents,
    },
    engagementSnapshots: snapshotResult,
    comments: commentResult,
  };
  store.addRun({ type: 'tikhub-collect', collectedAt: new Date().toISOString(), ...result });
  if (!dryRun) {
    await store.save();
  }
  return result;
}

async function syncEngagementSnapshots({ contents, request, feishuClient, feishuConfig, dryRun }) {
  const capturedAt = new Date().toISOString();
  const runId = request.runId ?? `run-${capturedAt}`;
  const items = contents.map((content) => buildEngagementSnapshot({ content, capturedAt, runId }));
  if (!dryRun && feishuClient && feishuConfig?.tables?.engagementSnapshots && items.length > 0) {
    const fields = feishuConfig.tables.engagementSnapshots.fields;
    await feishuClient.createRecords('engagementSnapshots', items.map((item) => mapEngagementSnapshotToFeishuFields(item, fields)));
  }
  return {
    capturedAt, runId, createdCount: items.length, items,
    reason: feishuConfig?.tables?.engagementSnapshots ? 'written-or-dry-run' : 'table-not-configured',
  };
}

function buildEngagementSnapshot({ content, capturedAt, runId }) {
  const publishedAt = content.publishedAt ?? null;
  const contentAgeDays = publishedAt
    ? Math.max(0, Math.floor((new Date(capturedAt).getTime() - new Date(publishedAt).getTime()) / 86_400_000))
    : null;
  return {
    snapshotKey: `${content.uniqueKey}:${capturedAt}`,
    contentUniqueKey: content.uniqueKey,
    publishedAt,
    capturedAt,
    contentAgeDays,
    metrics: content.metrics ?? {},
    runId,
    source: 'TikHub',
  };
}

function isWithinPublishedWindow(content, publishedAfter) {
  if (!publishedAfter) return true;
  if (!content.publishedAt) return true;
  const boundary = new Date(publishedAfter).getTime();
  const published = new Date(content.publishedAt).getTime();
  // Missing timestamps remain visible for manual review instead of being silently discarded.
  return !Number.isFinite(published) || !Number.isFinite(boundary) || published >= boundary;
}

function normalizeRequestPlatform(request) {
  return { ...request, platform: normalizePlatformId(request?.platform, 'TikHub request platform') };
}

async function hasKnownContent({ store, remoteContentKeys, content }) {
  for (const key of contentKeyAliases({ platform: content.platform, externalId: content.contentExternalId })) {
    if (store.hasContent(key) || await remoteContentKeys.has(key)) {
      return true;
    }
  }
  return false;
}

async function syncCreators({ request, contents, feishuClient, feishuConfig, dryRun }) {
  // Content authors remain content metadata until a human explicitly tracks an account.
  if (request.mode !== 'creator') {
    return { createdCount: 0, duplicateCount: 0, items: [], reason: 'content-research-does-not-create-creators' };
  }
  const candidates = uniqueCreators({ contents, request });
  if (candidates.length === 0) {
    return { createdCount: 0, duplicateCount: 0, items: [] };
  }
  if (request.creatorRecordId) {
    const creator = candidates[0];
    if (!dryRun && feishuClient) {
      const fields = feishuConfig.tables.creators.fields;
      await feishuClient.updateRecord('creators', request.creatorRecordId, mapCreatorTaskFields({
        platform: toFeishuPlatform(creator.platform),
        externalId: creator.externalId,
        homepageUrl: creator.homepageUrl,
        sourceLink: request.creatorSourceLink ?? creator.homepageUrl,
        linkType: '博主主页',
        sourceKind: 'TikHub',
        sourcePath: 'TikHub',
      }, fields));
    }
    return {
      createdCount: 0,
      updatedCount: 1,
      duplicateCount: 0,
      items: [creator],
      recordId: request.creatorRecordId,
      reason: 'updated-explicit-feishu-creator-record',
    };
  }
  const newCreators = [];
  for (const creator of candidates) {
    if (!await hasExistingCreator({ creator, feishuClient, feishuConfig, dryRun })) {
      newCreators.push(creator);
    }
  }
  if (!dryRun && feishuClient && newCreators.length > 0) {
    const fields = feishuConfig.tables.creators.fields;
    await feishuClient.createRecords('creators', newCreators.map((creator) => ({
      [fields.name]: creator.name,
      [fields.platform]: toFeishuPlatform(creator.platform),
      [fields.externalId]: creator.externalId,
      [fields.homepageUrl]: creator.homepageUrl,
      [fields.sourceLink]: creator.homepageUrl,
      [fields.linkType]: '博主主页',
      [fields.enabledStatus]: '启用',
      [fields.checkFrequency]: '手动',
      [fields.sourceKind]: 'TikHub',
      [fields.sourcePath]: 'TikHub',
      [fields.lastStatus]: '正常',
    })));
  }
  return { createdCount: newCreators.length, duplicateCount: candidates.length - newCreators.length, items: newCreators };
}

async function fetchContents({ request, client }) {
  if (request.mode === 'detail') {
    const response = await client.getContentDetail({
      platform: request.platform,
      shareUrl: request.shareUrl,
      contentId: request.contentId,
    });
    return {
      items: [response.data],
      cacheUrls: response.cacheUrl ? [response.cacheUrl] : [],
      audit: response.audit,
      pagination: { pageCount: 1, stoppedReason: 'detail' },
    };
  }
  const limit = request.limit ?? DEFAULT_LIMIT;
  return collectPages({
    limit,
    maxPages: request.maxPages,
    shouldStop: request.publishedAfter ? (items) => reachedPublishedBoundary({ items, platform: request.platform, publishedAfter: request.publishedAfter }) : null,
    getPage: (cursor) => request.mode === 'search'
      ? client.searchContents({ platform: request.platform, keyword: request.keyword, cursor })
      : client.getCreatorContents({ platform: request.platform, creatorId: request.creatorId, cursor, limit }),
  });
}

async function collectComments({ request, client, contents, feishuClient, feishuConfig, dryRun }) {
  if (!request.includeComments || contents.length === 0) {
    return { fetchedCount: 0, createdCount: 0, duplicateCount: 0, items: [], cacheUrls: [], audit: null, pagination: { pageCount: 0, stoppedReason: 'disabled' } };
  }
  const existingKeys = await loadRemoteKeys({ feishuClient, feishuConfig, tableName: 'comments', fieldKey: 'commentKey', dryRun });
  const comments = [];
  const cacheUrls = [];
  let audit = null;
  const pagination = [];
  for (const content of contents) {
    const response = await collectPages({
      limit: request.commentLimit ?? DEFAULT_LIMIT,
      maxPages: request.commentPages ?? 1,
      getPage: (cursor) => client.getComments({
        platform: request.platform,
        contentId: content.contentExternalId,
        shareUrl: content.url,
        cursor,
      }),
    });
    cacheUrls.push(...response.cacheUrls);
    audit = response.audit ?? audit;
    pagination.push({ contentUniqueKey: content.uniqueKey, ...response.pagination });
    comments.push(...normalizeTikHubComments({
      platform: request.platform,
      contentUniqueKey: content.uniqueKey,
      items: response.items,
    }));
  }
  const uniqueComments = uniqueByKey(comments, 'commentUniqueKey');
  const newComments = [];
  for (const comment of uniqueComments) {
    if (!await existingKeys.has(comment.commentUniqueKey)) {
      newComments.push(comment);
    }
  }
  if (!dryRun && feishuClient && newComments.length > 0) {
    const fields = feishuConfig.tables.comments.fields;
    await feishuClient.createRecords('comments', newComments.map((comment) => mapCommentToFeishuFields(comment, fields)));
  }
  return {
    fetchedCount: uniqueComments.length,
    createdCount: newComments.length,
    duplicateCount: uniqueComments.length - newComments.length,
    // Keep sampled comments available to research even when Feishu dedupe skips a repeat write.
    items: uniqueComments,
    cacheUrls: [...new Set(cacheUrls)],
    audit,
    pagination,
  };
}

async function collectPages({ limit, maxPages = 10, getPage, shouldStop = null }) {
  const items = [];
  const cacheUrls = [];
  const seenCursors = new Set();
  let cursor = null;
  let pageCount = 0;
  let audit = null;
  let stoppedReason = 'limit-reached';

  while (items.length < limit && pageCount < maxPages) {
    const response = await getPage(cursor);
    const page = extractTikHubPage(response.data);
    items.push(...page.items);
    if (response.cacheUrl) {
      cacheUrls.push(response.cacheUrl);
    }
    audit = response.audit ?? audit;
    pageCount += 1;

    if (shouldStop?.(page.items)) {
      stoppedReason = 'published-window-reached';
      break;
    }

    if (!page.hasMore) {
      stoppedReason = 'source-exhausted';
      break;
    }
    if (!page.cursor || seenCursors.has(page.cursor)) {
      stoppedReason = 'invalid-or-repeated-cursor';
      break;
    }
    seenCursors.add(page.cursor);
    cursor = page.cursor;
  }
  if (pageCount >= maxPages && items.length < limit) {
    stoppedReason = 'max-pages-reached';
  }
  return {
    items: items.slice(0, limit),
    cacheUrls,
    audit,
    pagination: { pageCount, stoppedReason },
  };
}

function reachedPublishedBoundary({ items, platform, publishedAfter }) {
  const boundary = new Date(publishedAfter).getTime();
  if (!Number.isFinite(boundary) || items.length === 0) return false;
  const timestamps = items.map((item) => new Date(normalizeTikHubContent({ platform, data: item }).publishedAt).getTime());
  // Account lists are expected newest-first. Stop only when an entire page is
  // dated and older than the window; undated records stay available for review.
  return timestamps.length > 0 && timestamps.every((timestamp) => Number.isFinite(timestamp) && timestamp < boundary);
}

async function loadRemoteKeys({ feishuClient, feishuConfig, tableName, fieldKey, dryRun }) {
  if (dryRun || !feishuClient || !feishuConfig) {
    return { has: async () => false };
  }
  const fieldName = feishuConfig.tables[tableName].fields[fieldKey];
  if (typeof feishuClient.listRecordsByField === 'function') {
    return {
      has: async (key) => {
        const records = await feishuClient.listRecordsByField(tableName, fieldName, key, [fieldName]);
        return records.some((record) => extractFeishuTextField(record, fieldName) === key);
      },
    };
  }
  const records = await feishuClient.listRecords(tableName);
  const keys = new Set(records.map((record) => extractFeishuTextField(record, fieldName)).filter(Boolean));
  return { has: async (key) => keys.has(key) };
}

async function hasExistingCreator({ creator, feishuClient, feishuConfig, dryRun }) {
  if (dryRun || !feishuClient || !feishuConfig) {
    return false;
  }
  const fields = feishuConfig.tables.creators.fields;
  const records = typeof feishuClient.listRecordsByField === 'function'
    ? await feishuClient.listRecordsByField('creators', fields.externalId, creator.externalId, [fields.platform, fields.externalId])
    : await feishuClient.listRecords('creators');
  const expectedPlatform = toFeishuPlatform(creator.platform);
  return records.some((record) => (
    extractFeishuTextField(record, fields.platform) === expectedPlatform
    && extractFeishuTextField(record, fields.externalId) === creator.externalId
  ));
}

function uniqueCreators({ contents, request }) {
  // The caller explicitly confirmed this account; response author metadata may be stale or unrelated.
  const matchingContent = contents.find((content) => content.creatorExternalId === request.creatorId);
  const namedContent = matchingContent ?? contents.find((content) => content.creatorName?.trim());
  return [{
    name: request.creatorName?.trim() || namedContent?.creatorName?.trim() || '未命名账号',
    platform: request.platform,
    externalId: request.creatorId,
    homepageUrl: request.creatorHomepageUrl,
  }];
}

function validateRequest(request) {
  const allowedModes = new Set(['detail', 'search', 'creator']);
  if (!allowedModes.has(request?.mode)) {
    throw new Error('TikHub request mode must be detail, search, or creator');
  }
  if (!request.platform) {
    throw new Error('TikHub request requires platform');
  }
  if (request.mode === 'detail' && !request.shareUrl && !request.contentId) {
    throw new Error('TikHub detail request requires shareUrl or contentId');
  }
  if (request.mode === 'search' && !request.keyword) {
    throw new Error('TikHub search request requires keyword');
  }
  if (request.mode === 'creator' && (!request.creatorId || !request.creatorHomepageUrl)) {
    throw new Error('TikHub creator request requires creatorId and creatorHomepageUrl');
  }
  if (request.mode === 'creator') {
    const homepage = describeContentLink({
      originalUrl: request.creatorHomepageUrl,
      finalUrl: request.creatorHomepageUrl,
    });
    if (homepage.platform !== request.platform || homepage.kind === 'content') {
      throw new Error('TikHub creator homepage must be a non-content URL on the requested platform');
    }
  }
}

function sanitizedRequest(request) {
  return {
    mode: request.mode,
    platform: request.platform,
    keyword: request.keyword ?? null,
    creatorId: request.creatorId ?? null,
    creatorHomepageUrl: request.creatorHomepageUrl ?? null,
    creatorName: request.creatorName ?? null,
    creatorRecordId: request.creatorRecordId ?? null,
    creatorSourceLink: request.creatorSourceLink ?? null,
    includeComments: Boolean(request.includeComments),
    limit: request.limit ?? DEFAULT_LIMIT,
    maxPages: request.maxPages ?? 10,
    commentLimit: request.commentLimit ?? DEFAULT_LIMIT,
    commentPages: request.commentPages ?? 1,
    publishedAfter: request.publishedAfter ?? null,
    runId: request.runId ?? null,
  };
}

function uniqueByKey(items, key) {
  return [...new Map(items.map((item) => [item[key], item])).values()];
}
