import { join, resolve } from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';
import { collectSingleContent } from './single-content-collect.mjs';
import { TikHubClient } from '../platforms/tikhub/client.mjs';
import { FEISHU_TABLE_SCHEMAS } from '../../config/schema.mjs';
import { mapFeishuContentRecord, mapFeishuProcessingTaskRecord, mapProcessingTaskToFeishuFields } from '../feishu/client.mjs';

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
    if (runnable.taskType !== 'L2 内容提纯') throw new Error(`不再自动执行任务类型：${runnable.taskType}`);
    const result = await runL2({ content, feishuClient, feishuConfig, storePath, outputDir });
    await updateTask(feishuClient, taskFields, runnable, { status: '完成', artifactPath: result.artifactPath ?? '', updatedAt: new Date().toISOString(), errorSummary: '' });
    return { processed: true, taskKey: runnable.taskKey, taskType: runnable.taskType, result };
  } catch (error) {
    return fail({ feishuClient, taskFields, task: runnable, message: summarizeError(error) });
  }
}

export async function syncCompletedTranscriptArtifacts({ feishuClient, feishuConfig, appDir = process.cwd() }) {
  const taskFields = feishuConfig.tables.contentProcessingTasks?.fields;
  if (!taskFields) return { syncedCount: 0, skippedCount: 0, reason: 'task-table-not-configured' };
  const tasks = (await feishuClient.listRecords('contentProcessingTasks'))
    .map((record) => ({ ...mapFeishuProcessingTaskRecord(record, taskFields), raw: record }))
    .filter((task) => task.taskType === 'L2 内容提纯' && task.status === '完成');
  const contents = (await feishuClient.listRecords('contents'))
    .map((record) => mapFeishuContentRecord(record, feishuConfig.tables.contents.fields));
  let syncedCount = 0;
  let skippedCount = 0;
  for (const task of tasks) {
    const artifactPath = task.raw.fields?.[taskFields.artifactPath] ?? '';
    const transcriptPath = await findRefinedTranscript(resolve(appDir, artifactPath));
    const transcript = transcriptPath ? await readFile(transcriptPath, 'utf8').catch(() => '') : '';
    const content = contents.find((item) => item.uniqueKey === task.contentKey);
    if (!content || !transcript) {
      skippedCount += 1;
      continue;
    }
    await writeTranscriptToFeishu({
      feishuClient, feishuConfig, content, transcript,
      source: inferTranscriptSource(transcriptPath), refinementStatus: '已完成',
    });
    syncedCount += 1;
  }
  return { syncedCount, skippedCount, taskCount: tasks.length };
}

async function runL2({ content, feishuClient, feishuConfig, storePath, outputDir }) {
  const result = await collectSingleContent({ platform: content.platform, shareUrl: content.url, client: new TikHubClient(), feishuClient, feishuConfig, storePath, outputDir, includeContent: true, includeComments: false });
  const media = result.collection.media;
  const artifactPath = media?.items?.[0]?.refinedTextPath ?? media?.items?.[0]?.artifactDir ?? '';
  if (result.layers.content.status === '失败') throw new Error(result.layers.content.error);
  const transcript = result.collection.contents.items.find((item) => item.uniqueKey === content.uniqueKey)?.refinedText ?? '';
  const source = media?.items?.[0]?.source ?? '';
  await writeTranscriptToFeishu({
    feishuClient,
    feishuConfig,
    content,
    transcript,
    source,
    refinementStatus: result.layers.content.status,
  });
  return { artifactPath, layer: result.layers.content.status };
}

export async function writeTranscriptToFeishu({ feishuClient, feishuConfig, content, transcript, source, refinementStatus }) {
  const fields = await ensureTranscriptFields({ feishuClient, feishuConfig });
  const update = {
    [fields.refinementStatus]: refinementStatus,
    [fields.transcriptSource]: source || undefined,
    [fields.transcriptText]: transcript || undefined,
  };
  await feishuClient.updateRecord('contents', content.recordId, update);
  return { written: Boolean(transcript), source, refinementStatus };
}

async function ensureTranscriptFields({ feishuClient, feishuConfig }) {
  const schemaFields = FEISHU_TABLE_SCHEMAS.contents.fields;
  const fields = {
    ...feishuConfig.tables.contents.fields,
    refinementStatus: schemaFields.refinementStatus.field_name,
    transcriptSource: schemaFields.transcriptSource.field_name,
    transcriptText: schemaFields.transcriptText.field_name,
  };
  const existing = new Set((await feishuClient.listFields('contents')).map((field) => field.field_name ?? field.name));
  for (const key of ['refinementStatus', 'transcriptSource', 'transcriptText']) {
    if (!existing.has(fields[key])) await feishuClient.createField('contents', schemaFields[key]);
  }
  return fields;
}

async function findRefinedTranscript(path) {
  const fileStat = await stat(path).catch(() => null);
  if (!fileStat) return null;
  if (fileStat.isFile()) return path.endsWith('.refined.txt') ? path : null;
  const entries = await readdir(path, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const found = await findRefinedTranscript(join(path, entry.name));
    if (found) return found;
  }
  return null;
}

function inferTranscriptSource(path) {
  return path.includes('platform-subtitle') ? '平台字幕' : '语音转写';
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
