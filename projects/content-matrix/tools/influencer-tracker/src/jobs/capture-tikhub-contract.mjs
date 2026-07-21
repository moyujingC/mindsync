import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { collectTikHubResearch } from './tikhub-collect.mjs';
import { normalizePlatformId } from '../platforms/platform-id.mjs';

export async function captureTikHubContract({ request, client, outputDir = 'fixtures/tikhub-contracts/real' }) {
  const platform = normalizePlatformId(request?.platform, 'TikHub contract capture platform');
  const responses = [];
  const originalHandler = client.onResponse;
  client.onResponse = async (event) => {
    await originalHandler?.(event);
    responses.push(sanitizeTikHubResponse(event));
  };

  try {
    const result = await collectTikHubResearch({
      request: { ...request, platform },
      client,
      storePath: resolve(outputDir, '.capture-store.json'),
      dryRun: true,
    });
    const resolvedOutputDir = resolve(outputDir);
    await mkdir(resolvedOutputDir, { recursive: true });
    const files = [];
    for (const [index, response] of responses.entries()) {
      const fileName = `${platform}-${String(index + 1).padStart(2, '0')}-${routeLabel(response.path)}.json`;
      const filePath = join(resolvedOutputDir, fileName);
      await writeFile(filePath, `${JSON.stringify(response, null, 2)}\n`, 'utf8');
      files.push(filePath);
    }
    return {
      status: 'ok',
      platform,
      files,
      responseCount: responses.length,
      collection: {
        contentCount: result.contents.fetchedCount,
        commentCount: result.comments.fetchedCount,
        requestCount: result.audit.requestCount,
        pagination: result.audit.pagination,
      },
      note: 'Captured responses are redacted contract fixtures. The run used dry-run and did not write Feishu or a research ledger.',
    };
  } finally {
    client.onResponse = originalHandler;
  }
}

export function sanitizeTikHubResponse(event) {
  return {
    schema: 'content-matrix/tikhub-contract-capture/v1',
    capturedAt: new Date().toISOString(),
    request: {
      path: event.path,
      method: event.method,
      params: sanitizeValue(event.params ?? {}, null),
      body: sanitizeValue(event.body ?? null, null),
    },
    response: {
      status: event.status,
      body: sanitizeValue(event.response ?? {}, null),
    },
  };
}

function sanitizeValue(value, key) {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeValue(entryValue, entryKey),
    ]));
  }
  if (shouldRedact(key)) {
    return `[redacted-${key}]`;
  }
  if (typeof value === 'string' && looksLikeUrl(value)) {
    return sanitizeUrl(value);
  }
  return value;
}

function shouldRedact(key) {
  return /^(authorization|token|api_?key|cookie|session|openid|open_id|unionid|union_id|sec_uid|user_?id|uid|nickname|user_?name|author_?name|avatar|phone|email|text|content|desc|description|message)$/i.test(key ?? '');
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(value);
}

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '[redacted-url]';
  }
}

function routeLabel(path) {
  return String(path).split('/').filter(Boolean).at(-1)?.replace(/[^a-zA-Z0-9_-]/g, '-') ?? 'response';
}
