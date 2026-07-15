import { resolve } from 'node:path';
import { readJsonFile } from '../utils/json-file.mjs';
import { mapCommentToFeishuFields, extractFeishuTextField } from '../feishu/client.mjs';
import { writeJobManifest } from '../utils/manifest.mjs';

export async function syncBilibiliComments({
  inputPath,
  artifactDir = null,
  feishuClient,
  feishuConfig,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const input = await readJsonFile(resolve(cwd, inputPath));
  const comments = normalizeBilibiliComments(input);
  const remoteCommentKeys = await loadRemoteCommentKeys({ feishuClient, feishuConfig, dryRun });

  const newComments = [];
  let duplicateCount = 0;

  for (const comment of comments) {
    if (remoteCommentKeys.has(comment.commentUniqueKey)) {
      duplicateCount += 1;
      continue;
    }
    newComments.push(comment);
  }

  let recordIds = [];
  if (!dryRun && feishuClient && newComments.length > 0) {
    const fieldMap = feishuConfig.tables.comments.fields;
    const records = newComments.map((comment) => mapCommentToFeishuFields(comment, fieldMap));
    recordIds = await feishuClient.createRecords('comments', records);
  }

  const result = {
    inputCount: comments.length,
    createdCount: newComments.length,
    duplicateCount,
    dryRun,
    recordIds,
    comments: newComments,
  };

  if (artifactDir) {
    await writeJobManifest({
      manifestPath: resolve(cwd, artifactDir, 'comments-manifest.json'),
      job: 'comments',
      status: 'ok',
      input: {
        inputPath: resolve(cwd, inputPath),
        dryRun,
      },
      output: {
        inputCount: result.inputCount,
        createdCount: result.createdCount,
        duplicateCount: result.duplicateCount,
        recordIds: result.recordIds,
      },
    });
  }

  return result;
}

export function normalizeBilibiliComments(input) {
  const contentUniqueKey = requiredString(input.contentUniqueKey, 'contentUniqueKey');
  const platform = input.platform ?? 'bilibili';
  const items = Array.isArray(input.comments) ? input.comments : [];
  return items.map((item, index) => normalizeCommentItem(item, index, { contentUniqueKey, platform }));
}

function normalizeCommentItem(item, index, { contentUniqueKey, platform }) {
  const commentId = requiredString(String(item.commentId ?? item.rpid ?? item.id ?? ''), `comments[${index}].commentId`);
  const commentText = requiredString(item.commentText ?? item.message ?? item.content?.message ?? '', `comments[${index}].commentText`);
  const userHandle = item.userHandle ?? item.userNickname ?? item.member?.uname ?? item.member?.mid ?? 'unknown';
  const commentedAt = normalizeDate(item.commentedAt ?? item.ctime ?? item.createdAt ?? new Date().toISOString());

  return {
    platform,
    contentUniqueKey,
    commentUniqueKey: `${platform}:${contentUniqueKey}:${commentId}`,
    commentId,
    commentText: normalizeCommentText(commentText),
    commentedAt,
    likeCount: numberOrNull(item.likeCount ?? item.like ?? item.like_count),
    userHandle: String(userHandle),
    demandType: normalizeDemandType(item.demandType),
    sentiment: normalizeSentiment(item.sentiment),
    insightStatus: normalizeInsightStatus(item.insightStatus),
    raw: item,
  };
}

async function loadRemoteCommentKeys({ feishuClient, feishuConfig, dryRun }) {
  if (dryRun || !feishuClient || !feishuConfig) {
    return new Set();
  }
  const commentKeyField = feishuConfig.tables.comments.fields.commentKey;
  const records = await feishuClient.listRecords('comments');
  return new Set(
    records
      .map((record) => extractFeishuTextField(record, commentKeyField))
      .filter(Boolean),
  );
}

function requiredString(value, path) {
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing comment field: ${path}`);
  }
  return value;
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function normalizeCommentText(value) {
  return String(value)
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function normalizeDemandType(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  return [String(value)];
}

function normalizeSentiment(value) {
  const allowed = new Set(['正向', '中性', '负向', '未判断']);
  return allowed.has(value) ? value : '未判断';
}

function normalizeInsightStatus(value) {
  const allowed = new Set(['是', '否', '待定']);
  return allowed.has(value) ? value : '待定';
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
