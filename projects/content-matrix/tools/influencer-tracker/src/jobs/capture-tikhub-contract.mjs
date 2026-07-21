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
      const fileName = `${platform}-${String(index + 1).padStart(2, '0')}-${routeLabel(response.request.path)}.json`;
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
  return sanitizeValueAtDepth(value, key, 0);
}

function sanitizeValueAtDepth(value, key, depth) {
  if (value === null || value === undefined) {
    return value;
  }
  if (shouldRedact(key)) {
    return `[redacted-${key}]`;
  }
  // Contract fixtures preserve response shape, not full platform payloads.
  if (depth >= 8) {
    return Array.isArray(value) ? '[omitted-array]' : typeof value === 'object' ? '[omitted-object]' : '[omitted-value]';
  }
  if (Array.isArray(value)) {
    return value.slice(0, 1).map((item) => sanitizeValueAtDepth(item, key, depth + 1));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeValueAtDepth(entryValue, entryKey, depth + 1),
    ]));
  }
  if (typeof value === 'string' && looksLikeUrl(value)) {
    return sanitizeUrl(value);
  }
  return value;
}

function shouldRedact(key) {
  return /^(authorization|api_?key|cookie|session|openid|open_id|unionid|union_id|sec_uid|user_?id|userid|uid|id|red_id|author_?id|request_id|debug_id|fileid|trace_id|(note|comment|object|doc)_?id|biz_?id|nickname|name|user_?name|author_?name|avatar|image|images|phone|email|text|content|desc|description|title|message|debug_info|widgets_context)$/i.test(key ?? '')
    || /(token|secret|signature)/i.test(key ?? '');
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
