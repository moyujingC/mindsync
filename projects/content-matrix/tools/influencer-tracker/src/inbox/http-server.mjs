import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { receiveLink } from './link-inbox.mjs';

const MAX_BODY_BYTES = 8 * 1024;

export function createLinkInboxHttpServer({
  token,
  storePath,
  resolveLink,
  feishuClient = null,
  feishuConfig = null,
  notify = null,
  maxRequestsPerMinute = 30,
  logger = console,
}) {
  if (!token?.trim()) throw new Error('Missing INBOX_RECEIVER_TOKEN');
  if (typeof resolveLink !== 'function') throw new Error('Missing resolveLink implementation');
  const limiter = createFixedWindowRateLimiter({ limit: maxRequestsPerMinute });

  return createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && request.url === '/health') {
        return sendJson(response, 200, { ok: true, service: 'link-inbox' });
      }
      if (request.method !== 'POST' || request.url !== '/v1/inbox/links') {
        return sendJson(response, 404, { ok: false, error: 'Not found' });
      }
      if (!isAuthorized(request.headers.authorization, token)) {
        return sendJson(response, 401, { ok: false, error: 'Unauthorized' });
      }
      if (!limiter.allow(clientAddress(request))) {
        return sendJson(response, 429, { ok: false, error: 'Too many requests' });
      }
      const body = await readJsonBody(request);
      if (body.mode && body.mode !== 'collect') {
        return sendJson(response, 400, { ok: false, error: 'Unsupported mode' });
      }
      const received = await receiveLink({
        url: body.url,
        source: body.source ?? 'iphone-back-tap',
        storePath,
        resolveLink,
        feishuClient,
        feishuConfig,
      });
      await notifySafely(notify, {
        title: received.duplicate ? '链接收件箱：已存在' : '链接收件箱：已收件',
        lines: [
          `平台：${received.item.platform}`,
          `状态：${received.item.status}`,
          `收件ID：${received.item.inboxId}`,
        ],
      }, logger);
      return sendJson(response, 202, {
        ok: true,
        accepted: !received.duplicate,
        duplicate: received.duplicate,
        inboxId: received.item.inboxId,
        status: received.item.status,
        platform: received.item.platform,
        linkKind: received.item.linkKind,
        message: received.duplicate ? '链接已在收件箱中。' : '链接已进入收件箱。',
        feishu: received.feishu,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const status = isClientError(message) ? 400 : 500;
      if (status === 500) logger.error?.(`[link-inbox] ${message}`);
      return sendJson(response, status, { ok: false, error: message });
    }
  });
}

function isAuthorized(header, expectedToken) {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  const provided = Buffer.from(header.slice('Bearer '.length));
  const expected = Buffer.from(expectedToken);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

async function notifySafely(notify, message, logger = console) {
  if (!notify) return;
  try {
    await notify(message);
  } catch (error) {
    logger.warn?.(`[link-inbox] notification failed: ${error.message}`);
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body is too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Request body must be a JSON object');
        resolve(body);
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function createFixedWindowRateLimiter({ limit }) {
  const windows = new Map();
  return {
    allow(key) {
      const now = Date.now();
      const current = windows.get(key);
      if (!current || now - current.startedAt >= 60_000) {
        windows.set(key, { startedAt: now, count: 1 });
        return true;
      }
      if (current.count >= limit) return false;
      current.count += 1;
      return true;
    },
  };
}

function clientAddress(request) {
  return request.socket.remoteAddress ?? 'unknown';
}

function isClientError(message) {
  return /Missing content link|Content link|Unsupported or unsafe|Unsupported platform|Short link|Request body|Request body is too large/.test(message);
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(`${JSON.stringify(payload)}\n`);
}
