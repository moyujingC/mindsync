import { resolve } from 'node:path';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { FeishuBitableClient } from '../feishu/client.mjs';
import { collectTikHubResearch } from '../jobs/tikhub-collect.mjs';
import { runResearchRequest } from '../jobs/research-request.mjs';
import { TikHubClient } from '../platforms/tikhub/client.mjs';
import { resolveContentLink } from '../platforms/content-link.mjs';
import { LinkInboxStore } from '../storage/link-inbox-store.mjs';
import { ingestFeishuInboxRows, syncLinkInboxToFeishu } from './link-inbox.mjs';

export async function processNextLinkInbox({
  storePath,
  feishuClient = null,
  feishuConfig = null,
  processItem = null,
  outputDir = 'logs/research-briefs',
  ledgerPath = 'logs/research-requests.json',
  contentStorePath = 'logs/content-store.tikhub.json',
  notify = null,
}) {
  const store = new LinkInboxStore({ filePath: storePath });
  await store.load();
  const feishuImport = await ingestFeishuSafely({ store, feishuClient, feishuConfig });
  const claimed = store.claimNext();
  if (!claimed) return { processed: false, reason: 'empty', feishuImport };
  await store.save();
  const claimSync = await syncSafely({ item: claimed, feishuClient, feishuConfig });

  try {
    const result = processItem
      ? await processItem(claimed)
      : await collectInboxItem({
        item: claimed,
        feishuClient,
        feishuConfig,
        outputDir,
        ledgerPath,
        contentStorePath,
      });
    const completed = store.complete(claimed.inboxId, { result: summarizeResult(result) });
    await store.save();
    const completionSync = await syncSafely({ item: completed, feishuClient, feishuConfig });
    await notifySafely(notify, {
      title: '链接收件箱：处理完成',
      lines: [`收件ID：${completed.inboxId}`, completed.result],
    });
    return { processed: true, ok: true, item: completed, result, feishu: { import: feishuImport, claim: claimSync, completion: completionSync } };
  } catch (error) {
    const failed = store.fail(claimed.inboxId, error);
    await store.save();
    const failureSync = await syncSafely({ item: failed, feishuClient, feishuConfig });
    await notifySafely(notify, {
      title: '链接收件箱：处理失败',
      lines: [`收件ID：${failed.inboxId}`, `错误：${failed.errorSummary}`],
    });
    return { processed: true, ok: false, item: failed, error: summarizeError(error), feishu: { import: feishuImport, claim: claimSync, failure: failureSync } };
  }
}

export async function retryLinkInbox({ storePath, inboxId, feishuClient = null, feishuConfig = null }) {
  const store = new LinkInboxStore({ filePath: storePath });
  await store.load();
  const item = store.retry(inboxId);
  await store.save();
  return { item, feishu: await syncSafely({ item, feishuClient, feishuConfig }) };
}

export function createFeishuClient(config) {
  if (!config) return null;
  return config.mode === 'lark-cli' ? new LarkCliBitableClient(config) : new FeishuBitableClient(config);
}

async function collectInboxItem({ item, feishuClient, feishuConfig, outputDir, ledgerPath, contentStorePath }) {
  if (item.linkKind !== 'content') throw new Error(`Link inbox item is not a content detail: ${item.linkKind}`);
  return runResearchRequest({
    request: {
      requestId: `research-${item.inboxId}`,
      purpose: '收藏整理',
      serviceDirection: '墨予镜',
      targetAccount: '墨予镜',
      collect: {
        mode: 'detail',
        platform: item.platform,
        shareUrl: item.finalUrl,
        includeComments: true,
        commentLimit: 10,
      },
    },
    collect: (request) => collectTikHubResearch({
      request,
      client: new TikHubClient(),
      feishuClient,
      feishuConfig,
      storePath: resolve(contentStorePath),
    }),
    outputDir: resolve(outputDir),
    ledgerPath: resolve(ledgerPath),
    feishuClient,
    feishuConfig,
  });
}

async function syncSafely({ item, feishuClient, feishuConfig }) {
  try {
    return await syncLinkInboxToFeishu({ item, feishuClient, feishuConfig });
  } catch (error) {
    return { synced: false, reason: 'sync-failed', error: summarizeError(error) };
  }
}

async function ingestFeishuSafely({ store, feishuClient, feishuConfig }) {
  try {
    return await ingestFeishuInboxRows({
      store,
      feishuClient,
      feishuConfig,
      resolveLink: resolveContentLink,
    });
  } catch (error) {
    // Existing local queue items remain processable while Feishu is temporarily unavailable.
    return { scannedCount: 0, importedCount: 0, duplicateCount: 0, manualReviewCount: 0, errorCount: 0, reason: 'sync-failed', error: summarizeError(error) };
  }
}

function summarizeResult(result) {
  const parts = [result.requestId ? `研究请求：${result.requestId}` : null];
  const keys = result.collection?.contentKeys ?? result.contents?.items?.map((item) => item.uniqueKey) ?? [];
  if (keys.length > 0) parts.push(`内容：${keys.join(', ')}`);
  return parts.filter(Boolean).join('\n');
}

function summarizeError(error) {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  return message.replace(/\s+/g, ' ').slice(0, 300);
}

async function notifySafely(notify, message) {
  if (!notify) return;
  try {
    await notify(message);
  } catch {
    // Notifications are observability only and must not change queue state.
  }
}
