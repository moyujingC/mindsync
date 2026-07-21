import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkResearchReadiness } from '../src/jobs/preflight-readiness.mjs';

test('preflight blocks real collection when TikHub key is missing', async () => {
  const result = await checkResearchReadiness({
    apiKey: '',
    ledgerPath: '/tmp/non-existent-preflight-ledger.json',
  });

  assert.equal(result.ok, false);
  assert.match(result.blockers.join('\n'), /Missing TIKHUB_API_KEY/);
  assert.match(result.warnings.join('\n'), /No Feishu config/);
});

test('preflight reports configured Feishu and existing publication feedback as ready', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'preflight-ready-'));
  const ledgerPath = join(dir, 'research-requests.json');
  try {
    await writeFile(ledgerPath, JSON.stringify({ requests: [{
      candidates: [{
        status: '已发布',
        conclusionLevel: '已验证',
        publicationFeedback: { publishUrl: 'https://example.com/published' },
      }],
    }] }), 'utf8');
    const result = await checkResearchReadiness({
      apiKey: 'test-key',
      feishuConfig: feishuConfig(),
      ledgerPath,
    });

    assert.equal(result.ok, true);
    assert.equal(result.safeToRunWriteMode, true);
    assert.equal(result.checks.ledger.publishedCandidateCount, 1);
    assert.equal(result.checks.ledger.verifiedCandidateCount, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('preflight probe reports TikHub 402 without writing the ledger', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'preflight-probe-'));
  const ledgerPath = join(dir, 'research-requests.json');
  const original = JSON.stringify({ requests: [] }, null, 2);
  try {
    await writeFile(ledgerPath, original, 'utf8');
    const result = await checkResearchReadiness({
      apiKey: 'test-key',
      ledgerPath,
      probe: { platform: 'xiaohongshu', shareUrl: 'https://example.com/public-note' },
      tikhubClient: {
        async getContentDetail() {
          throw new Error('TikHub returned 402: check account balance or endpoint entitlement');
        },
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.checks.probe.ok, false);
    assert.match(result.blockers.join('\n'), /TikHub probe failed.*402/);
    assert.equal(await readFile(ledgerPath, 'utf8'), original);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function feishuConfig() {
  const fields = {
    creators: ['name', 'platform', 'externalId', 'homepageUrl', 'enabledStatus', 'checkFrequency', 'lastCheckedAt', 'latestContentAt', 'lastStatus', 'failureReason', 'sourceKind', 'sourcePath'],
    contents: ['uniqueKey', 'platform', 'externalId', 'url', 'title', 'description', 'publishedAt', 'collectedAt', 'contentType', 'tags', 'likeCount', 'commentCount', 'favoriteCount', 'shareCount', 'analysisStatus'],
    comments: ['commentKey', 'contentKey', 'commentText', 'commentedAt', 'likeCount', 'userHandle', 'demandType', 'sentiment', 'insightStatus'],
    insights: ['title', 'sourceContentKeys', 'sourceCommentKeys', 'insightType', 'targetAccounts', 'evidenceSummary', 'nextAction', 'status'],
  };
  return {
    mode: 'lark-cli',
    baseAppToken: 'base-test',
    tables: Object.fromEntries(Object.entries(fields).map(([tableName, keys]) => [
      tableName,
      { tableId: `tbl-${tableName}`, fields: Object.fromEntries(keys.map((key) => [key, key])) },
    ])),
  };
}
