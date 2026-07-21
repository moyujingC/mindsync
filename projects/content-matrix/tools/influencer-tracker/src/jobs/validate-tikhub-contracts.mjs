import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { normalizePlatformId } from '../platforms/platform-id.mjs';

const PLATFORM_IDS = ['xiaohongshu', 'douyin', 'wechat_mp', 'wechat_channels'];
const REQUIRED_KINDS = ['detail', 'search', 'creator', 'comments'];

export async function validateTikHubContractFixtures({ fixtureDir = 'fixtures/tikhub-contracts/real', platforms = PLATFORM_IDS }) {
  const resolvedFixtureDir = resolve(fixtureDir);
  const selectedPlatforms = [...new Set(platforms.map((platform) => normalizePlatformId(platform, 'TikHub contract platform')))];
  const files = await listJsonFiles(resolvedFixtureDir);
  const results = [];

  for (const filePath of files) {
    const raw = await readFile(filePath, 'utf8');
    try {
      const fixture = JSON.parse(raw);
      results.push(validateFixture({ filePath, fixture }));
    } catch (error) {
      results.push({ filePath, ok: false, platform: null, kind: null, errors: [`Invalid JSON: ${error.message}`] });
    }
  }

  const coverage = Object.fromEntries(selectedPlatforms.map((platform) => {
    const platformResults = results.filter((result) => result.platform === platform && result.ok);
    const kinds = new Set(platformResults.map((result) => result.kind).filter(Boolean));
    const missing = REQUIRED_KINDS.filter((kind) => !kinds.has(kind));
    return [platform, { capturedKinds: [...kinds].sort(), missingKinds: missing, ok: missing.length === 0 }];
  }));
  const invalidFiles = results.filter((result) => !result.ok);

  return {
    ok: invalidFiles.length === 0 && Object.values(coverage).every((item) => item.ok),
    fixtureDir: resolvedFixtureDir,
    scannedFileCount: files.length,
    invalidFiles,
    coverage,
    note: 'Validation is read-only. A passing fixture set proves response-shape coverage and redaction only; it does not prove TikHub entitlement, Feishu writes, or business outcomes.',
  };
}

export function validateFixture({ filePath, fixture }) {
  const errors = [];
  if (fixture?.schema !== 'content-matrix/tikhub-contract-capture/v1') {
    errors.push('Unexpected capture schema');
  }
  if (!fixture?.request?.path || !fixture?.request?.method) {
    errors.push('Missing request path or method');
  }
  if (!Number.isInteger(fixture?.response?.status) || fixture.response.status < 200 || fixture.response.status >= 300) {
    errors.push('Response status must be a successful HTTP status');
  }
  if (fixture?.response?.body?.code !== 200) {
    errors.push('Response body code must be 200');
  }
  const sensitiveValues = findUnsafeValues(fixture);
  if (sensitiveValues.length > 0) {
    errors.push(`Unsafe values remain: ${sensitiveValues.join(', ')}`);
  }
  return {
    filePath,
    ok: errors.length === 0,
    platform: platformFromFileName(filePath),
    kind: classifyRoute(fixture?.request?.path),
    errors,
  };
}

function findUnsafeValues(value, key = null, path = '$') {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findUnsafeValues(item, key, `${path}[${index}]`));
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([entryKey, entryValue]) => findUnsafeValues(entryValue, entryKey, `${path}.${entryKey}`));
  }
  const unsafe = [];
  if (isSensitiveKey(key) && value !== `[redacted-${key}]`) {
    unsafe.push(path);
  }
  if (typeof value === 'string' && /^https?:\/\//i.test(value) && new URL(value).search) {
    unsafe.push(path);
  }
  return unsafe;
}

function isSensitiveKey(key) {
  return /^(authorization|api_?key|cookie|session|openid|open_id|unionid|union_id|sec_uid|user_?id|userid|uid|short_id|unique_id|id|red_id|author_?id|request_id|debug_id|fileid|trace_id|uri|(note|comment|object|doc|aweme)_?id|biz_?id|nickname|name|user_?name|author_?name|avatar.*|image|images|phone|email|text|content|desc|description|title|message|debug_info|widgets_context)$/i.test(key ?? '')
    || /(token|secret|signature)/i.test(key ?? '');
}

function classifyRoute(path) {
  const normalized = String(path ?? '');
  if (/comments/i.test(normalized)) {
    return 'comments';
  }
  if (/search/i.test(normalized)) {
    return 'search';
  }
  if (/user_posted|user_post_videos|account_articles|user_videos/i.test(normalized)) {
    return 'creator';
  }
  if (/detail|fetch_one_video/i.test(normalized)) {
    return 'detail';
  }
  return null;
}

function platformFromFileName(filePath) {
  const name = filePath.split('/').at(-1) ?? '';
  return PLATFORM_IDS.find((platform) => name.startsWith(`${platform}-`)) ?? null;
}

async function listJsonFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const entryPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        return listJsonFiles(entryPath);
      }
      return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : [];
    }));
    return nested.flat().sort();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
