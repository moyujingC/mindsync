import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFile } from '../utils/json-file.mjs';

const INITIAL_STATE = {
  schema: 'content-matrix/link-inbox/v1',
  records: [],
};

export class LinkInboxStore {
  constructor({ filePath }) {
    this.filePath = filePath;
    this.state = structuredClone(INITIAL_STATE);
  }

  async load() {
    this.state = await readJsonFile(this.filePath, structuredClone(INITIAL_STATE));
    this.state.records ??= [];
  }

  get(inboxId) {
    return this.state.records.find((item) => item.inboxId === inboxId) ?? null;
  }

  enqueue({ originalUrl, resolved, source }) {
    const existing = this.state.records.find((item) => (
      item.originalUrl === originalUrl || item.finalUrl === resolved.finalUrl
    ));
    if (existing) return { item: existing, duplicate: true };

    const now = new Date().toISOString();
    const item = {
      inboxId: createInboxId(resolved.finalUrl),
      originalUrl,
      finalUrl: resolved.finalUrl,
      platform: resolved.platform,
      linkKind: resolved.kind,
      receivedAt: now,
      source,
      status: resolved.kind === 'content' ? '待处理' : '需人工处理',
      result: '',
      retryCount: 0,
      errorSummary: resolved.kind === 'content' ? '' : describeManualAction(resolved.kind),
      updatedAt: now,
    };
    this.state.records.unshift(item);
    return { item, duplicate: false };
  }

  claimNext() {
    const item = this.state.records.find((record) => record.status === '待处理');
    if (!item) return null;
    item.status = '处理中';
    item.errorSummary = '';
    item.updatedAt = new Date().toISOString();
    return item;
  }

  complete(inboxId, { result }) {
    return this.update(inboxId, (item) => ({ ...item, status: '已完成', result: result ?? item.result, errorSummary: '' }));
  }

  fail(inboxId, error) {
    return this.update(inboxId, (item) => ({
      ...item,
      status: '失败',
      retryCount: (item.retryCount ?? 0) + 1,
      errorSummary: summarizeError(error),
    }));
  }

  retry(inboxId) {
    return this.update(inboxId, (item) => {
      if (item.status !== '失败') throw new Error(`Only failed inbox records can be retried: ${inboxId}`);
      return { ...item, status: '待处理', errorSummary: '' };
    });
  }

  update(inboxId, update) {
    const index = this.state.records.findIndex((item) => item.inboxId === inboxId);
    if (index === -1) throw new Error(`Link inbox record not found: ${inboxId}`);
    const next = { ...update(this.state.records[index]), updatedAt: new Date().toISOString() };
    this.state.records[index] = next;
    return next;
  }

  async save() {
    await writeJsonFile(this.filePath, this.state);
  }
}

function createInboxId(finalUrl) {
  const digest = createHash('sha256').update(finalUrl).digest('hex').slice(0, 16);
  return `inbox-${digest}`;
}

function describeManualAction(kind) {
  if (kind === 'creator') return '链接是博主主页，请人工决定是否创建账号追踪。';
  return '未识别为内容详情，请检查复制的链接。';
}

function summarizeError(error) {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  return message.replace(/\s+/g, ' ').slice(0, 300);
}
