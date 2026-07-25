import { collectTikHubResearch } from './tikhub-collect.mjs';
import { loadCreators } from './load-creators.mjs';
import { mapCreatorTaskFields, toFeishuPlatform } from '../feishu/client.mjs';
import { resolveContentLink } from '../platforms/content-link.mjs';
import { normalizePlatformId } from '../platforms/platform-id.mjs';
import { TikHubClient } from '../platforms/tikhub/client.mjs';

const PENDING_ACTIONS = new Set(['待解析链接', '待检查', '待回溯']);

export async function runFeishuCreatorWorker({
  feishuPath,
  loaded = null,
  storePath,
  limit = 10,
  dryRun = false,
  cwd = process.cwd(),
  resolveLink = resolveContentLink,
  collect = null,
}) {
  const source = loaded ?? await loadCreators({ feishuPath, cwd });
  requireCreatorTaskFields(source.feishuConfig);
  const pendingCreators = source.creators.filter(isPendingCreator);
  const results = [];

  for (const creator of pendingCreators) {
    const startedAt = new Date().toISOString();
    if (!dryRun) {
      await updateCreator(source, creator.recordId, {
        taskStatus: '执行中',
        taskLockedAt: startedAt,
        lastStatus: '正常',
        failureReason: '',
      });
    }

    try {
      const prepared = await prepareCreator({ creator, resolveLink });
      if (!dryRun) await updateCreator(source, creator.recordId, prepared.creatorFields);
      const result = await (collect ?? collectCreatorContents)({
        creator: prepared.creator,
        source,
        storePath,
        limit,
        dryRun,
      });
      const summary = buildSummary(result);
      if (!dryRun) {
        await updateCreator(source, creator.recordId, {
          collectAction: '无',
          taskStatus: '完成',
          taskReport: summary,
          lastStatus: '正常',
          failureReason: '',
          lastCheckedAt: new Date().toISOString(),
          latestContentAt: latestPublishedAt(result.contents?.items ?? []),
        });
      }
      results.push({ creatorId: creator.recordId, creatorName: creator.name, action: creator.collectAction, ok: true, summary, result });
    } catch (error) {
      if (!dryRun) {
        await updateCreator(source, creator.recordId, {
          taskStatus: '失败',
          taskReport: summarizeError(error),
          lastStatus: '失败',
          failureReason: summarizeError(error),
          lastCheckedAt: new Date().toISOString(),
          ...error.creatorFields,
        });
      }
      results.push({ creatorId: creator.recordId, creatorName: creator.name, action: creator.collectAction, ok: false, error: summarizeError(error) });
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

async function prepareCreator({ creator, resolveLink }) {
  const sourceUrl = creator.sourceLink || creator.homepageUrl;
  if (!sourceUrl) throw new Error('Missing source link or homepage URL');

  const resolved = await resolveLink({ url: sourceUrl });
  if (resolved.kind !== 'creator') {
    throw new Error(`Creator task requires a creator homepage, received ${resolved.kind}: ${resolved.finalUrl}`);
  }
  if (!resolved.creatorId) {
    throw new Error(`Creator homepage did not expose a collectable account ID: ${resolved.finalUrl}`);
  }
  const platform = normalizePlatformId(resolved.platform, 'resolved creator platform');
  const creatorFields = {
    platform: toFeishuPlatform(platform),
    externalId: resolved.creatorId,
    homepageUrl: resolved.finalUrl,
    sourceLink: creator.sourceLink || resolved.originalUrl,
    linkType: '博主主页',
    sourceKind: 'TikHub',
    sourcePath: 'TikHub',
  };
  return {
    creator: {
      ...creator,
      platform,
      externalId: resolved.creatorId,
      homepageUrl: resolved.finalUrl,
      sourceLink: creator.sourceLink || resolved.originalUrl,
    },
    creatorFields,
  };
}

async function collectCreatorContents({ creator, source, storePath, limit, dryRun }) {
  return collectTikHubResearch({
    request: {
      mode: 'creator',
      platform: creator.platform,
      creatorId: creator.externalId,
      creatorHomepageUrl: creator.homepageUrl,
      creatorName: creator.name,
      creatorRecordId: creator.recordId,
      creatorSourceLink: creator.sourceLink,
      limit,
      includeComments: false,
    },
    client: new TikHubClient(),
    feishuClient: source.feishuClient,
    feishuConfig: source.feishuConfig,
    storePath,
    dryRun,
  });
}

function isPendingCreator(creator) {
  return creator.enabledStatus === '启用'
    && PENDING_ACTIONS.has(creator.collectAction)
    && creator.taskStatus !== '执行中';
}

async function updateCreator(source, recordId, fields) {
  await source.feishuClient.updateRecord(
    'creators',
    recordId,
    mapCreatorTaskFields(fields, source.feishuConfig.tables.creators.fields),
  );
}

function buildSummary(result) {
  return `账号采集完成：新增 ${result.contents?.createdCount ?? 0} 条，重复 ${result.contents?.duplicateCount ?? 0} 条。`;
}

function latestPublishedAt(contents) {
  const timestamps = contents
    .map((content) => new Date(content.publishedAt).getTime())
    .filter(Number.isFinite);
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : undefined;
}

function summarizeError(error) {
  return (error instanceof Error ? error.message : String(error ?? 'Unknown error')).replace(/\s+/g, ' ').slice(0, 300);
}

function requireCreatorTaskFields(config) {
  const fields = config?.tables?.creators?.fields ?? {};
  const missing = ['collectAction', 'taskStatus', 'taskReport', 'taskLockedAt']
    .filter((field) => !fields[field]);
  if (missing.length > 0) throw new Error(`Missing creator task field mapping: ${missing.join(', ')}`);
}
