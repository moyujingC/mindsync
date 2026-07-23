#!/usr/bin/env node
import { resolve } from 'node:path';
import { createFeishuClient } from '../inbox/link-inbox-worker.mjs';
import { createLinkInboxHttpServer } from '../inbox/http-server.mjs';
import { createFeishuGroupNotifier } from '../notifications/feishu-group.mjs';
import { resolveContentLink } from '../platforms/content-link.mjs';
import { readJsonFile } from '../utils/json-file.mjs';
import { parseArgs } from '../utils/args.mjs';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();
const port = Number(args.port ?? process.env.PORT ?? 8787);

try {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
  const feishuConfig = args.feishu ? await readJsonFile(resolve(cwd, args.feishu)) : null;
  const notify = createFeishuGroupNotifier();
  const server = createLinkInboxHttpServer({
    token: process.env.INBOX_RECEIVER_TOKEN,
    storePath: resolve(cwd, args.store ?? 'logs/link-inbox.json'),
    resolveLink: resolveContentLink,
    feishuClient: createFeishuClient(feishuConfig),
    feishuConfig,
    notify,
    maxRequestsPerMinute: Number(args.rateLimit ?? process.env.INBOX_RATE_LIMIT ?? 30),
  });
  server.listen(port, args.host ?? process.env.HOST ?? '127.0.0.1', () => {
    console.log(JSON.stringify({ ok: true, service: 'link-inbox', port, health: '/health' }));
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.close(() => process.exit(0)));
  }
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
