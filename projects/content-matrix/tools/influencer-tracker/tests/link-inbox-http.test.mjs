import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLinkInboxHttpServer } from '../src/inbox/http-server.mjs';

test('HTTP receiver accepts an authorized link and returns an asynchronous receipt', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/v1/inbox/links`, {
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.douyin.com/video/1234567890', source: 'iphone-back-tap' }),
    });
    const body = await response.json();

    assert.equal(response.status, 202);
    assert.equal(body.ok, true);
    assert.equal(body.status, '待处理');
    assert.equal(body.linkKind, 'content');
  });
});

test('HTTP receiver rejects unauthorized and unsupported requests', async () => {
  await withServer(async ({ baseUrl }) => {
    const unauthorized = await fetch(`${baseUrl}/v1/inbox/links`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.douyin.com/video/1234567890' }),
    });
    const unsupported = await fetch(`${baseUrl}/v1/inbox/links`, {
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/not-allowed' }),
    });

    assert.equal(unauthorized.status, 401);
    assert.equal(unsupported.status, 400);
  });
});

test('HTTP receiver reports health without requiring a token', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.deepEqual(await response.json(), { ok: true, service: 'link-inbox' });
  });
});

test('HTTP receiver keeps a receipt when group notification fails', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/v1/inbox/links`, {
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.douyin.com/video/1234567890' }),
    });
    assert.equal(response.status, 202);
  }, { notify: async () => { throw new Error('group unavailable'); } });
});

async function withServer(run, { notify = null } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'link-inbox-http-'));
  const server = createLinkInboxHttpServer({
    token: 'test-token',
    storePath: join(dir, 'link-inbox.json'),
    resolveLink: async ({ url }) => {
      if (url.includes('example.com')) throw new Error('Unsupported or unsafe link host: example.com');
      return {
        originalUrl: url,
        finalUrl: url,
        redirects: [],
        platform: 'douyin',
        kind: 'content',
        contentId: '1234567890',
      };
    },
    logger: { error() {} },
    notify,
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    await run({ baseUrl: `http://127.0.0.1:${port}` });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
}
