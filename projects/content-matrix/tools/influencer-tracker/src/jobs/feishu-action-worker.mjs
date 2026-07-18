import { checkUpdates } from './check-updates.mjs';
import { backfillCreator } from './backfill-creator.mjs';
import { loadCreators } from './load-creators.mjs';
import { importManualContentItems } from './manual-import.mjs';
import { normalizeBilibiliUid, resolveBilibiliLink } from './resolve-bilibili-link.mjs';
import { mapCreatorTaskFields } from '../feishu/client.mjs';

const BILIBILI_RSS_BASE = 'https://rsshub.app/bilibili/user/video';
const ACTION_RESOLVE_LINK = '待解析链接';
const ACTION_CHECK = '待检查';
const ACTION_BACKFILL = '待回溯';

export async function runFeishuActionWorker({
  feishuPath,
  loaded = null,
  storePath,
  limit = 20,
  dryRun = false,
  cwd = process.cwd(),
  resolveLink = resolveBilibiliLink,
}) {
  const source = loaded ?? await loadCreators({
    feishuPath,
    cwd,
  });
  requireCreatorTaskFields(source.feishuConfig);

  const pendingCreators = source.creators.filter(isPendingCreator);
  const results = [];

  for (const creator of pendingCreators) {
    const startedAt = new Date().toISOString();
    if (!dryRun) {
      await updateCreatorTask(source, creator.recordId, {
        taskStatus: '执行中',
        taskLockedAt: startedAt,
        lastStatus: '正常',
        failureReason: '',
      });
    }

    try {
      const result = await runCreatorAction({
        creator,
        loaded: source,
        storePath,
        limit,
        dryRun,
        cwd,
        resolveLink,
      });
      const summary = buildTaskReport({ creator, result });

      if (!dryRun) {
        await updateCreatorTask(source, creator.recordId, {
          collectAction: '无',
          taskStatus: '完成',
          taskReport: summary,
          lastStatus: '正常',
          failureReason: '',
          lastCheckedAt: new Date().toISOString(),
          latestContentAt: latestPublishedAt(result.contents ?? []),
          ...result.creatorFields,
        });
      }

      results.push({
        creatorId: creator.id,
        creatorName: creator.name,
        action: creator.collectAction,
        ok: true,
        summary,
        result,
      });
    } catch (error) {
      if (!dryRun) {
        await updateCreatorTask(source, creator.recordId, {
          taskStatus: '失败',
          taskReport: error.message,
          lastStatus: '失败',
          failureReason: error.message,
          lastCheckedAt: new Date().toISOString(),
          ...error.partialCreatorFields,
        });
      }
      results.push({
        creatorId: creator.id,
        creatorName: creator.name,
        action: creator.collectAction,
        ok: false,
        error: error.message,
      });
    }
  }

  return {
    dryRun,
    scannedCount: source.creators.length,
    pendingCount: pendingCreators.length,
    successCount: results.filter((item) => item.ok).length,
    failedCount: results.filter((item) => !item.ok).length,
    results,
  };
}

function isPendingCreator(creator) {
  return creator.enabledStatus === '启用'
    && [ACTION_RESOLVE_LINK, ACTION_CHECK, ACTION_BACKFILL].includes(creator.collectAction)
    && creator.taskStatus !== '执行中';
}

async function runCreatorAction({
  creator,
  loaded,
  storePath,
  limit,
  dryRun,
  cwd,
  resolveLink,
}) {
  if (creator.collectAction === ACTION_RESOLVE_LINK) {
    return resolveCreatorLinkAction({
      creator,
      loaded,
      storePath,
      dryRun,
      resolveLink,
    });
  }

  if (creator.collectAction === ACTION_CHECK) {
    const prepared = await prepareCreatorForCollection({ creator, resolveLink });
    const effectiveCreator = prepared.creator;
    const result = await runCollectionWithPreparedFields(prepared, () => checkUpdates({
      creators: [effectiveCreator],
      feishuClient: loaded.feishuClient,
      feishuConfig: loaded.feishuConfig,
      storePath,
      dryRun,
      platform: effectiveCreator.platform,
      limitPerCreator: limit,
      cwd,
    }));
    return {
      ...result,
      creatorFields: prepared.creatorFields,
    };
  }

  if (creator.collectAction === ACTION_BACKFILL) {
    const prepared = await prepareCreatorForCollection({ creator, resolveLink });
    const effectiveCreator = prepared.creator;
    const result = await runCollectionWithPreparedFields(prepared, () => backfillCreator({
      creators: [effectiveCreator],
      creatorId: effectiveCreator.id,
      feishuClient: loaded.feishuClient,
      feishuConfig: loaded.feishuConfig,
      storePath,
      dryRun,
      limit,
      since: effectiveCreator.collectSince,
      cwd,
    }));
    return {
      ...result,
      creatorFields: prepared.creatorFields,
    };
  }

  throw new Error(`Unsupported collect action: ${creator.collectAction}`);
}

async function runCollectionWithPreparedFields(prepared, collect) {
  try {
    return await collect();
  } catch (error) {
    error.partialCreatorFields = prepared.creatorFields;
    throw error;
  }
}

async function prepareCreatorForCollection({ creator, resolveLink }) {
  if (!isBilibiliCreator(creator)) {
    return { creator, creatorFields: {} };
  }

  const normalizedUid = normalizeBilibiliUid(creator.externalId);
  if (/^\d+$/.test(normalizedUid)) {
    const fields = buildBilibiliCreatorFields(normalizedUid);
    return {
      creator: {
        ...creator,
        ...fields,
        source: creator.source ?? { kind: fields.sourceKind, url: fields.sourcePath },
      },
      creatorFields: shouldWriteBackCreatorFields(creator, fields) ? fields : {},
    };
  }

  const link = creator.sourceLink || creator.homepageUrl;
  if (!link) {
    return { creator, creatorFields: {} };
  }

  const resolved = await resolveLink(link);
  if (resolved.kind === 'content') {
    throw new Error('当前链接是 B站单条视频，不能直接回溯/检查博主；请把采集动作改为“待解析链接”，或粘贴博主主页链接。');
  }
  if (resolved.kind !== 'creator') {
    return { creator, creatorFields: {} };
  }

  const fields = {
    platform: resolved.platform,
    externalId: resolved.externalId,
    homepageUrl: resolved.homepageUrl,
    sourceLink: resolved.finalUrl,
    linkType: '博主主页',
    sourceKind: resolved.sourceKind,
    sourcePath: resolved.sourcePath,
  };
  return {
    creator: {
      ...creator,
      ...fields,
      source: { kind: fields.sourceKind, url: fields.sourcePath },
    },
    creatorFields: fields,
  };
}

function isBilibiliCreator(creator) {
  return creator.platform === 'bilibili'
    || creator.platform === 'B站'
    || /bilibili\.com|b23\.tv/.test(`${creator.homepageUrl ?? ''} ${creator.sourceLink ?? ''}`);
}

function buildBilibiliCreatorFields(uid) {
  return {
    platform: 'bilibili',
    externalId: uid,
    homepageUrl: `https://space.bilibili.com/${uid}`,
    linkType: '博主主页',
    sourceKind: 'rss',
    sourcePath: `${BILIBILI_RSS_BASE}/${uid}`,
  };
}

function shouldWriteBackCreatorFields(creator, fields) {
  return creator.platform !== fields.platform
    || creator.externalId !== fields.externalId
    || creator.homepageUrl !== fields.homepageUrl
    || creator.source?.kind !== fields.sourceKind
    || creator.source?.url !== fields.sourcePath;
}

async function resolveCreatorLinkAction({
  creator,
  loaded,
  storePath,
  dryRun,
  resolveLink,
}) {
  const link = creator.sourceLink || creator.homepageUrl;
  if (!link) {
    throw new Error('Missing source link or homepage URL');
  }
  const resolved = await resolveLink(link);

  if (resolved.kind === 'creator') {
    return {
      actionType: 'resolve-link',
      resolved,
      createdCount: 0,
      duplicateCount: 0,
      contents: [],
      creatorFields: {
        platform: resolved.platform,
        externalId: resolved.externalId,
        homepageUrl: resolved.homepageUrl,
        sourceLink: resolved.finalUrl,
        linkType: '博主主页',
        sourceKind: resolved.sourceKind,
        sourcePath: resolved.sourcePath,
      },
    };
  }

  if (resolved.kind === 'content') {
    const importResult = await importManualContentItems({
      items: [resolved.content],
      storePath,
      feishuClient: loaded.feishuClient,
      feishuConfig: loaded.feishuConfig,
      dryRun,
      runType: 'feishu-link-reference',
    });
    return {
      actionType: 'resolve-link',
      resolved,
      createdCount: importResult.createdCount,
      duplicateCount: importResult.duplicateCount,
      contents: importResult.contents,
      creatorFields: {
        sourceLink: resolved.finalUrl,
        linkType: '单条内容',
      },
    };
  }

  throw new Error(`Unsupported Bilibili link: ${resolved.finalUrl}`);
}

async function updateCreatorTask(loaded, recordId, fields) {
  const fieldMap = loaded.feishuConfig.tables.creators.fields;
  await loaded.feishuClient.updateRecord('creators', recordId, mapCreatorTaskFields(fields, fieldMap));
}

function buildTaskReport({ creator, result }) {
  if (creator.collectAction === ACTION_RESOLVE_LINK) {
    if (result.resolved.kind === 'creator') {
      return `链接解析完成：识别为 B站博主主页，UID ${result.resolved.externalId}，已补全 RSS 地址。`;
    }
    return `链接解析完成：识别为 B站单条内容，新增 ${result.createdCount} 条，重复 ${result.duplicateCount} 条。`;
  }
  if (creator.collectAction === ACTION_CHECK) {
    return `检查完成：新增 ${result.createdCount} 条，重复 ${result.duplicateCount} 条，失败 ${result.failedCount} 个账号。`;
  }
  return `回溯完成：候选 ${result.candidateCount} 条，新增 ${result.createdCount} 条，重复 ${result.duplicateCount} 条。`;
}

function latestPublishedAt(contents) {
  const timestamps = contents
    .map((content) => content.publishedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));
  if (timestamps.length === 0) {
    return undefined;
  }
  return new Date(Math.max(...timestamps)).toISOString();
}

function requireCreatorTaskFields(feishuConfig) {
  const fields = feishuConfig.tables.creators.fields;
  const missing = [
    'collectAction',
    'taskStatus',
    'collectSince',
    'taskReport',
    'taskLockedAt',
  ].filter((field) => !fields[field]);
  if (missing.length > 0) {
    throw new Error(`Missing creator task field mapping: ${missing.join(', ')}`);
  }
}
