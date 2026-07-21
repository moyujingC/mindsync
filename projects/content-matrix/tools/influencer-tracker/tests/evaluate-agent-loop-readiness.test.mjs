import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateAgentLoopReadiness } from '../src/jobs/evaluate-agent-loop-readiness.mjs';

test('agent loop readiness stays blocked without three real adjusted feedback cycles', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'agent-loop-readiness-'));
  try {
    await writeLedger(dir, [publishedRequest('research-1', adjustment({ changed: '是', type: '关键词', note: '下一轮改查流程诊断。' })), publishedRequest('research-2', null)]);
    const result = await evaluateAgentLoopReadiness({ ledgerPath: join(dir, 'research-requests.json') });

    assert.equal(result.eligibleForEvaluation, false);
    assert.equal(result.publishedCycleCount, 2);
    assert.equal(result.adjustedCycleCount, 1);
    assert.match(result.blockers.join('\n'), /Need 2 more real publish-feedback-adjustment cycles/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('agent loop readiness requires distinct research requests with explicit changes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'agent-loop-readiness-'));
  try {
    await writeLedger(dir, [
      publishedRequest('research-1', adjustment({ changed: '是', type: '关键词', note: '改关键词。' })),
      publishedRequest('research-2', adjustment({ changed: '是', type: '样本范围', note: '缩小到医疗行业。' })),
      publishedRequest('research-3', adjustment({ changed: '是', type: 'CTA', note: '改为邀请提供小样本。' })),
    ]);
    const result = await evaluateAgentLoopReadiness({ ledgerPath: join(dir, 'research-requests.json') });

    assert.equal(result.eligibleForEvaluation, true);
    assert.equal(result.adjustedCycleCount, 3);
    assert.equal(result.distinctAdjustedRequestCount, 3);
    assert.equal(result.blockers.length, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function publishedRequest(requestId, researchAdjustment) {
  return {
    requestId,
    serviceDirection: '企业 AI 服务',
    candidates: [{
      status: '已发布',
      publicationFeedback: {
        publishUrl: `https://example.com/${requestId}`,
        publishedAt: '2026-07-21T10:00:00+08:00',
        researchAdjustment,
      },
    }],
  };
}

function adjustment(value) {
  return value;
}

async function writeLedger(dir, requests) {
  await writeFile(join(dir, 'research-requests.json'), `${JSON.stringify({
    schema: 'content-matrix/research-request-ledger/v1',
    requests,
  }, null, 2)}\n`, 'utf8');
}
