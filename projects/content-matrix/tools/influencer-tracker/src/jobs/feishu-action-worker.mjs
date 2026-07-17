import { checkUpdates } from './check-updates.mjs';
import { backfillCreator } from './backfill-creator.mjs';
import { loadCreators } from './load-creators.mjs';
import { mapCreatorTaskFields } from '../feishu/client.mjs';

const ACTION_CHECK = '待检查';
const ACTION_BACKFILL = '待回溯';

export async function runFeishuActionWorker({
  feishuPath,
  loaded = null,
  storePath,
  limit = 20,
  dryRun = false,
  cwd = process.cwd(),
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
    && [ACTION_CHECK, ACTION_BACKFILL].includes(creator.collectAction)
    && creator.taskStatus !== '执行中';
}

async function runCreatorAction({
  creator,
  loaded,
  storePath,
  limit,
  dryRun,
  cwd,
}) {
  if (creator.collectAction === ACTION_CHECK) {
    return checkUpdates({
      creators: [creator],
      feishuClient: loaded.feishuClient,
      feishuConfig: loaded.feishuConfig,
      storePath,
      dryRun,
      platform: creator.platform,
      limitPerCreator: limit,
      cwd,
    });
  }

  if (creator.collectAction === ACTION_BACKFILL) {
    return backfillCreator({
      creators: [creator],
      creatorId: creator.id,
      feishuClient: loaded.feishuClient,
      feishuConfig: loaded.feishuConfig,
      storePath,
      dryRun,
      limit,
      since: creator.collectSince,
      cwd,
    });
  }

  throw new Error(`Unsupported collect action: ${creator.collectAction}`);
}

async function updateCreatorTask(loaded, recordId, fields) {
  const fieldMap = loaded.feishuConfig.tables.creators.fields;
  await loaded.feishuClient.updateRecord('creators', recordId, mapCreatorTaskFields(fields, fieldMap));
}

function buildTaskReport({ creator, result }) {
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
