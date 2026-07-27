import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { collectSingleContent } from './single-content-collect.mjs';
import { buildContentEnrichment } from './enrich-content.mjs';
import { TikHubClient } from '../platforms/tikhub/client.mjs';
import { mapFeishuContentRecord, mapFeishuProcessingTaskRecord, mapProcessingTaskToFeishuFields, mapTopicCandidateToFeishuFields } from '../feishu/client.mjs';

export async function processNextContentTask({ feishuClient, feishuConfig, appDir = process.cwd(), storePath, outputDir }) {
  const taskFields = feishuConfig.tables.contentProcessingTasks?.fields;
  if (!taskFields) return { processed: false, reason: 'task-table-not-configured' };
  const taskRecords = await feishuClient.listRecords('contentProcessingTasks');
  const tasks = taskRecords.map((record) => ({ ...mapFeishuProcessingTaskRecord(record, taskFields), raw: record }));
  await releaseDependencies({ feishuClient, taskFields, tasks });
  const runnable = tasks.filter((task) => task.status === '待处理').sort((a, b) => b.priority - a.priority)[0];
  if (!runnable) return { processed: false, reason: 'empty-or-waiting' };
  const content = await findContent({ feishuClient, feishuConfig, contentKey: runnable.contentKey });
  if (!content) return fail({ feishuClient, taskFields, task: runnable, message: '未找到来源内容，无法执行加工任务' });
  await updateTask(feishuClient, taskFields, runnable, { status: '执行中', updatedAt: new Date().toISOString(), errorSummary: '' });
  try {
    const result = runnable.taskType === 'L2 内容提纯'
      ? await runL2({ content, feishuClient, feishuConfig, storePath, outputDir })
      : await runTopicInsight({ content, feishuClient, feishuConfig, appDir, tasks: taskRecords, taskFields });
    await updateTask(feishuClient, taskFields, runnable, { status: '完成', artifactPath: result.artifactPath ?? '', updatedAt: new Date().toISOString(), errorSummary: '' });
    return { processed: true, taskKey: runnable.taskKey, taskType: runnable.taskType, result };
  } catch (error) {
    return fail({ feishuClient, taskFields, task: runnable, message: summarizeError(error) });
  }
}

async function runL2({ content, feishuClient, feishuConfig, storePath, outputDir }) {
  const result = await collectSingleContent({ platform: content.platform, shareUrl: content.url, client: new TikHubClient(), feishuClient, feishuConfig, storePath, outputDir, includeContent: true, includeComments: false });
  const media = result.collection.media;
  const artifactPath = media?.items?.[0]?.refinedTextPath ?? media?.items?.[0]?.artifactDir ?? '';
  if (result.layers.content.status === '失败') throw new Error(result.layers.content.error);
  return { artifactPath, layer: result.layers.content.status };
}

async function runTopicInsight({ content, feishuClient, feishuConfig, appDir, tasks, taskFields }) {
  const dependency = tasks.map((record) => ({ ...mapFeishuProcessingTaskRecord(record, taskFields), raw: record }))
    .find((task) => task.taskKey === `${content.uniqueKey}::L2 内容提纯`);
  const artifactPath = dependency?.raw?.fields?.[taskFields.artifactPath] ?? '';
  const transcript = artifactPath ? await readFile(resolve(appDir, artifactPath), 'utf8').catch(() => '') : '';
  const enrichment = buildContentEnrichment({ metadata: content, transcript, comments: [] });
  const candidate = { ...enrichment.topicCandidates[0], source: { contentUniqueKey: content.uniqueKey }, targetAccounts: ['墨予镜'] };
  const fields = feishuConfig.tables.insights.fields;
  const existing = await feishuClient.listRecords('insights');
  if (!existing.some((record) => record.fields?.[fields.sourceContentKeys] === content.uniqueKey && record.fields?.[fields.insightType] === '选题')) {
    await feishuClient.createRecords('insights', [mapTopicCandidateToFeishuFields(candidate, fields)]);
  }
  return { artifactPath: artifactPath || `洞察与选题:${content.uniqueKey}`, candidate: candidate.topicTitle };
}

async function releaseDependencies({ feishuClient, taskFields, tasks }) {
  for (const task of tasks.filter((item) => item.status === '等待依赖')) {
    const dependency = tasks.find((item) => item.taskKey === task.dependencyTaskKey);
    if (dependency?.status === '完成') await updateTask(feishuClient, taskFields, task, { status: '待处理', updatedAt: new Date().toISOString() });
    if (dependency?.status === '失败' || dependency?.status === '需人工处理') await updateTask(feishuClient, taskFields, task, { status: '需人工处理', errorSummary: '依赖的 L2 内容提纯未完成', updatedAt: new Date().toISOString() });
  }
}

async function findContent({ feishuClient, feishuConfig, contentKey }) {
  const records = await feishuClient.listRecords('contents');
  return records.map((record) => mapFeishuContentRecord(record, feishuConfig.tables.contents.fields)).find((content) => content.uniqueKey === contentKey);
}

async function updateTask(feishuClient, fields, task, patch) {
  await feishuClient.updateRecord('contentProcessingTasks', task.recordId, mapProcessingTaskToFeishuFields({ ...task, ...patch }, fields));
}

async function fail({ feishuClient, taskFields, task, message }) {
  await updateTask(feishuClient, taskFields, task, { status: '失败', errorSummary: message, updatedAt: new Date().toISOString() });
  return { processed: true, taskKey: task.taskKey, taskType: task.taskType, ok: false, error: message };
}

function summarizeError(error) { return (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').slice(0, 300); }
