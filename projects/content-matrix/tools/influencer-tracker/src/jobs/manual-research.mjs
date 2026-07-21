import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { extractFeishuTextField, mapCommentToFeishuFields } from '../feishu/client.mjs';
import { importManualContentItems, normalizeManualInput } from './manual-import.mjs';
import { runResearchRequest } from './research-request.mjs';
import { ResearchRequestStore } from '../storage/research-request-store.mjs';

export async function runManualResearchRequest({
  request,
  items,
  storePath,
  ledgerPath,
  outputDir,
  feishuClient = null,
  feishuConfig = null,
  dryRun = false,
  inputPath = null,
}) {
  const normalizedContents = await attachRefinedTextEvidence({
    contents: normalizeManualInput({ items }),
    inputPath,
  });
  if (dryRun) {
    return runResearchRequest({
      request,
      ledgerPath,
      outputDir,
      persist: false,
      collect: async (collectRequest) => buildManualCollection({
        collectRequest,
        normalizedContents,
        contentResult: { createdCount: normalizedContents.length, duplicateCount: 0 },
      }),
    });
  }
  if (request?.requestId) {
    const requestStore = new ResearchRequestStore({ filePath: ledgerPath });
    await requestStore.load();
    if (requestStore.get(request.requestId)) {
      return runResearchRequest({
        request,
        ledgerPath,
        outputDir,
        feishuClient,
        feishuConfig,
        collect: async () => {
          throw new Error('Existing manual research request must not collect again');
        },
      });
    }
  }
  const importResult = await importManualContentItems({
    items,
    storePath,
    feishuClient,
    feishuConfig,
    dryRun: false,
    inputPath,
    runType: 'manual-research-import',
  });

  return runResearchRequest({
    request,
    ledgerPath,
    outputDir,
    feishuClient,
    feishuConfig,
    collect: async (collectRequest) => buildManualCollection({
      collectRequest,
      normalizedContents,
      contentResult: importResult,
      syncComments: async (comments) => syncManualComments({
        comments,
        feishuClient,
        feishuConfig,
        dryRun: false,
      }),
    }),
  });
}

async function attachRefinedTextEvidence({ contents, inputPath }) {
  return Promise.all(contents.map(async (content) => {
    const configuredPath = content.raw?.refinedTextPath;
    if (!configuredPath) {
      return content;
    }
    if (typeof configuredPath !== 'string' || !configuredPath.trim()) {
      throw new Error(`refinedTextPath must be a non-empty string for ${content.uniqueKey}`);
    }
    const refinedTextPath = resolveRefinedTextPath(configuredPath, inputPath);
    let refinedText;
    try {
      refinedText = await readFile(refinedTextPath, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') {
        throw new Error(`Refined text file not found for ${content.uniqueKey}: ${refinedTextPath}`);
      }
      throw error;
    }
    const text = refinedText.trim();
    if (!text) {
      throw new Error(`Refined text file is empty for ${content.uniqueKey}: ${refinedTextPath}`);
    }
    return {
      ...content,
      researchEvidence: {
        refinedTextPath,
        characterCount: text.length,
      },
      refinedText: text,
    };
  }));
}

function resolveRefinedTextPath(configuredPath, inputPath) {
  if (isAbsolute(configuredPath)) {
    return resolve(configuredPath);
  }
  if (!inputPath) {
    throw new Error(`Relative refinedTextPath requires inputPath: ${configuredPath}`);
  }
  return resolve(dirname(inputPath), configuredPath);
}

async function buildManualCollection({ collectRequest, normalizedContents, contentResult, syncComments = null }) {
  const comments = collectRequest.includeComments
    ? normalizeManualResearchComments(normalizedContents)
    : [];
  const commentResult = syncComments
    ? await syncComments(comments)
    : {
      fetchedCount: comments.length,
      createdCount: 0,
      duplicateCount: 0,
      items: comments,
    };
  return {
    request: {
      mode: collectRequest.mode,
      platform: collectRequest.platform,
      includeComments: Boolean(collectRequest.includeComments),
      limit: collectRequest.limit,
    },
    audit: {
      source: 'manual-research',
      requestCount: 0,
      cacheUrls: [],
    },
    contents: {
      fetchedCount: normalizedContents.length,
      createdCount: contentResult.createdCount,
      duplicateCount: contentResult.duplicateCount,
      items: normalizedContents,
    },
    comments: commentResult,
  };
}

export function normalizeManualResearchComments(contents) {
  const comments = [];
  for (const content of contents) {
    const sourceComments = content.raw?.comments ?? [];
    if (!Array.isArray(sourceComments)) {
      throw new Error(`Manual research comments must be an array for ${content.uniqueKey}`);
    }
    sourceComments.forEach((item, index) => {
      const commentText = String(item.commentText ?? item.text ?? item.content ?? '').trim();
      if (!commentText) {
        throw new Error(`Manual research comment text is required for ${content.uniqueKey} at index ${index}`);
      }
      const commentId = String(item.commentId ?? item.id ?? `manual-${index + 1}`);
      comments.push({
        platform: content.platform,
        contentUniqueKey: content.uniqueKey,
        commentUniqueKey: `manual:${content.uniqueKey}:${commentId}`,
        commentId,
        commentText,
        commentedAt: item.commentedAt ?? item.createdAt ?? new Date().toISOString(),
        likeCount: numberOrZero(item.likeCount),
        userHandle: item.userHandle ?? item.user ?? '匿名手工样本',
        demandType: Array.isArray(item.demandType) ? item.demandType : [],
        sentiment: item.sentiment ?? '未判断',
        insightStatus: '待定',
        raw: item,
      });
    });
  }
  return comments;
}

async function syncManualComments({ comments, feishuClient, feishuConfig, dryRun }) {
  if (comments.length === 0) {
    return emptyComments();
  }
  const existingKeys = await loadRemoteCommentKeys({ feishuClient, feishuConfig, dryRun });
  const newComments = comments.filter((comment) => !existingKeys.has(comment.commentUniqueKey));
  if (!dryRun && feishuClient && newComments.length > 0) {
    const fields = feishuConfig.tables.comments.fields;
    await feishuClient.createRecords('comments', newComments.map((comment) => mapCommentToFeishuFields(comment, fields)));
  }
  return {
    fetchedCount: comments.length,
    createdCount: newComments.length,
    duplicateCount: comments.length - newComments.length,
    items: newComments,
  };
}

async function loadRemoteCommentKeys({ feishuClient, feishuConfig, dryRun }) {
  if (dryRun || !feishuClient || !feishuConfig) {
    return new Set();
  }
  const fieldName = feishuConfig.tables.comments.fields.commentKey;
  const records = await feishuClient.listRecords('comments');
  return new Set(records.map((record) => extractFeishuTextField(record, fieldName)).filter(Boolean));
}

function emptyComments() {
  return { fetchedCount: 0, createdCount: 0, duplicateCount: 0, items: [] };
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
