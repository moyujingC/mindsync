import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  confirmResearchCandidate,
  runResearchRequest,
  setResearchRequestTargetAccount,
} from '../src/jobs/research-request.mjs';
import { ResearchRequestStore } from '../src/storage/research-request-store.mjs';

test('runResearchRequest produces an evidence-backed enterprise AI research brief', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-'));
  try {
    const result = await runResearchRequest({
      request: {
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note', includeComments: true },
      },
      collect: async () => ({
        request: { mode: 'detail', platform: 'xiaohongshu', includeComments: true, limit: 10 },
        audit: { source: 'tikhub', requestCount: 2, cacheUrls: ['https://cache.example/note'] },
        contents: { fetchedCount: 1, createdCount: 1, duplicateCount: 0, items: [{ uniqueKey: 'xiaohongshu:note-1', platform: 'xiaohongshu', creatorName: 'AI 实践者', contentExternalId: 'note-1', title: '企业 AI 先从一个流程试点', description: '先找到重复、可验收的流程。', url: 'https://example.com/note' }] },
        comments: { fetchedCount: 2, createdCount: 2, duplicateCount: 0, items: [{ commentUniqueKey: 'xiaohongshu:x:1', commentText: '怎么判断先做哪个流程？', demandType: ['问题咨询'], likeCount: 5 }, { commentUniqueKey: 'xiaohongshu:x:2', commentText: '能不能先做低成本试点？', demandType: ['购买意向'], likeCount: 3 }] },
      }),
      outputDir: dir,
    });

    const brief = await readFile(result.outputPath, 'utf8');
    assert.equal(result.status, '待人工确认');
    assert.equal(result.targetAccount, '墨予镜');
    assert.equal(result.candidates.length, 1);
    assert.match(brief, /研究目的：评论挖需求/);
    assert.match(brief, /服务方向：企业 AI 服务/);
    assert.match(brief, /怎么判断先做哪个流程/);
    assert.match(brief, /人工确认后再进入选题、发布或样本沟通/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('runResearchRequest rejects a request without purpose or service direction', async () => {
  await assert.rejects(
    () => runResearchRequest({ request: { collect: { mode: 'search' } }, collect: async () => ({}) }),
    /requires purpose and serviceDirection/,
  );
});

test('runResearchRequest dry-run leaves its ledger and brief directory untouched', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-dry-run-'));
  try {
    const ledgerPath = join(dir, 'research-requests.json');
    const outputDir = join(dir, 'briefs');
    const result = await runResearchRequest({
      request: {
        requestId: 'research-dry-run-1',
        purpose: '选题调研',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'search', platform: 'xiaohongshu', keyword: '企业 AI' },
      },
      collect: async () => collectionFixture(),
      outputDir,
      ledgerPath,
      persist: false,
    });

    assert.equal(result.outputPath, null);
    assert.deepEqual(result.feishu, { synced: false, reason: 'dry-run' });
    await assert.rejects(() => readFile(ledgerPath, 'utf8'));
    await assert.rejects(() => readFile(join(outputDir, 'research-dry-run-1.md'), 'utf8'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('runResearchRequest preserves a numeric content ID for platform detail workflows', async () => {
  let collectRequest = null;
  await runResearchRequest({
    request: {
      requestId: 'research-content-id-1',
      purpose: '选题调研',
      serviceDirection: '企业 AI 服务',
      collect: { mode: 'detail', platform: 'wechat_channels', contentId: '11403202356913418951' },
    },
    collect: async (request) => {
      collectRequest = request;
      return collectionFixture();
    },
    persist: false,
  });

  assert.equal(collectRequest.contentId, '11403202356913418951');
});

test('runResearchRequest persists a request ledger with evidence and conclusion levels', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-ledger-'));
  try {
    const storePath = join(dir, 'research-requests.json');
    const result = await runResearchRequest({
      request: {
        requestId: 'research-ledger-1',
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note', includeComments: true },
      },
      collect: async () => collectionFixture(),
      outputDir: join(dir, 'briefs'),
      ledgerPath: storePath,
    });

    const store = new ResearchRequestStore({ filePath: storePath });
    await store.load();
    const saved = store.get(result.requestId);

    assert.equal(saved.status, '待人工确认');
    assert.equal(saved.candidates[0].evidenceLevel, '观察');
    assert.equal(saved.candidates[0].conclusionLevel, '假设');
    assert.equal(saved.candidates[0].status, '待人工审核');
    assert.equal(saved.outputPath, result.outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('runResearchRequest writes the selected orchestration template and constraints into its brief', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-template-'));
  try {
    const result = await runResearchRequest({
      request: {
        requestId: 'research-template-yijing-1',
        templateId: 'yijing_yishu',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note' },
      },
      collect: async () => collectionFixture(),
      outputDir: join(dir, 'briefs'),
      ledgerPath: join(dir, 'research-requests.json'),
    });

    const brief = await readFile(result.outputPath, 'utf8');
    assert.equal(result.targetAccount, '一镜一梳');
    assert.equal(result.collection.sampleLimit, 5);
    assert.match(brief, /研究模板：一镜一梳内容研究/);
    assert.match(brief, /不输出心理诊断/);
    assert.equal((brief.match(/内容样本：/g) ?? []).length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('confirmResearchCandidate records human topic decision and rejects invalid state transitions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-confirm-'));
  try {
    const storePath = join(dir, 'research-requests.json');
    await runResearchRequest({
      request: {
        requestId: 'research-confirm-1',
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note', includeComments: true },
      },
      collect: async () => collectionFixture(),
      outputDir: join(dir, 'briefs'),
      ledgerPath: storePath,
    });

    await assert.rejects(
      () => confirmResearchCandidate({
        ledgerPath: storePath,
        requestId: 'research-confirm-1',
        candidateIndex: 1,
        action: '已发布',
        decisionNote: '不应跳过选题人工确认。',
      }),
      /cannot move directly from 待人工审核 to 已发布/,
    );

    const confirmed = await confirmResearchCandidate({
      ledgerPath: storePath,
      requestId: 'research-confirm-1',
      candidateIndex: 1,
      action: '转选题',
      decisionNote: '用于下一轮企业 AI 服务选题。',
    });

    assert.equal(confirmed.status, '已转选题');
    assert.equal(confirmed.candidates[0].status, '已转选题');
    assert.equal(confirmed.candidates[0].conclusionLevel, '假设');
    const brief = await readFile(confirmed.outputPath, 'utf8');
    assert.match(brief, /当前状态：已转选题/);
    assert.match(brief, /选题状态：已转选题/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('confirmResearchCandidate requires human verification evidence before marking a conclusion verified', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-verify-'));
  try {
    const storePath = join(dir, 'research-requests.json');
    await runResearchRequest({
      request: {
        requestId: 'research-verify-1',
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note', includeComments: true },
      },
      collect: async () => collectionFixture(),
      outputDir: join(dir, 'briefs'),
      ledgerPath: storePath,
    });

    await assert.rejects(
      () => confirmResearchCandidate({
        ledgerPath: storePath,
        requestId: 'research-verify-1',
        candidateIndex: 1,
        action: '验证',
      }),
      /verificationEvidence/,
    );

    const verified = await confirmResearchCandidate({
      ledgerPath: storePath,
      requestId: 'research-verify-1',
      candidateIndex: 1,
      action: '验证',
      verificationEvidence: '2026-07-21 样本沟通记录：两名目标用户确认流程诊断需求。',
    });

    assert.equal(verified.candidates[0].conclusionLevel, '已验证');
    assert.equal(verified.candidates[0].verificationEvidence, '2026-07-21 样本沟通记录：两名目标用户确认流程诊断需求。');
    assert.ok(verified.candidates[0].verifiedAt);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('setResearchRequestTargetAccount updates the request, candidates, brief, and Feishu summary', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-target-account-'));
  try {
    const storePath = join(dir, 'research-requests.json');
    await runResearchRequest({
      request: {
        requestId: 'research-target-account-1',
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        targetAccount: '一镜一梳',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note' },
      },
      collect: async () => collectionFixture(),
      outputDir: join(dir, 'briefs'),
      ledgerPath: storePath,
    });
    const updates = [];
    const updated = await setResearchRequestTargetAccount({
      ledgerPath: storePath,
      requestId: 'research-target-account-1',
      targetAccount: '墨予镜',
      decisionNote: '企业 AI 服务内容发布到墨予镜。',
      feishuConfig: { tables: { researchRequests: { fields: researchRequestFields() } } },
      feishuClient: {
        async listRecords() { return [{ record_id: 'rec_target_account', fields: { 请求ID: 'research-target-account-1' } }]; },
        async updateRecord(tableName, recordId, fields) { updates.push({ tableName, recordId, fields }); },
      },
    });

    assert.equal(updated.targetAccount, '墨予镜');
    assert.equal(updated.candidates[0].targetAccount, '墨予镜');
    assert.equal(updated.decisions.at(-1).action, '变更目标账号');
    assert.equal(updates[0].fields['目标账号'], '墨予镜');
    const brief = await readFile(updated.outputPath, 'utf8');
    assert.match(brief, /目标账号：墨予镜/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('enterprise AI research always routes content to moyujing', async () => {
  const result = await runResearchRequest({
    request: {
      requestId: 'research-enterprise-route-1',
      templateId: 'enterprise_ai_service',
      targetAccount: '任意旧账号',
      collect: { mode: 'search', platform: 'xiaohongshu', keyword: '企业 AI' },
    },
    collect: async () => collectionFixture(),
    persist: false,
  });

  assert.equal(result.serviceDirection, '企业 AI 服务');
  assert.equal(result.targetAccount, '墨予镜');
  assert.ok(result.candidates.every((candidate) => candidate.targetAccount === '墨予镜'));
});

test('runResearchRequest retries Feishu sync for an existing request without recollecting samples', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-feishu-retry-'));
  try {
    const storePath = join(dir, 'research-requests.json');
    let collectCalls = 0;
    const first = await runResearchRequest({
      request: {
        requestId: 'research-feishu-retry-1',
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note' },
      },
      collect: async () => {
        collectCalls += 1;
        return collectionFixture();
      },
      outputDir: join(dir, 'briefs'),
      ledgerPath: storePath,
    });
    const calls = [];
    const retry = await runResearchRequest({
      request: {
        requestId: 'research-feishu-retry-1',
        purpose: 'ignored',
        serviceDirection: 'ignored',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/ignored' },
      },
      collect: async () => {
        collectCalls += 1;
        return collectionFixture();
      },
      outputDir: join(dir, 'briefs'),
      ledgerPath: storePath,
      feishuConfig: { tables: { researchRequests: { fields: researchRequestFields() } } },
      feishuClient: {
        async listRecords() { return []; },
        async createRecords(tableName, records) {
          calls.push({ tableName, records });
          return ['rec_research_1'];
        },
      },
    });

    assert.equal(collectCalls, 1);
    assert.equal(retry.outputPath, first.outputPath);
    assert.deepEqual(retry.feishu, { synced: true, action: 'created', recordId: 'rec_research_1' });
    assert.equal(calls[0].records[0]['请求ID'], 'research-feishu-retry-1');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('confirmResearchCandidate updates an existing Feishu research request record', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-feishu-update-'));
  try {
    const storePath = join(dir, 'research-requests.json');
    await runResearchRequest({
      request: {
        requestId: 'research-feishu-update-1',
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note' },
      },
      collect: async () => collectionFixture(),
      outputDir: join(dir, 'briefs'),
      ledgerPath: storePath,
    });
    const updates = [];
    const confirmed = await confirmResearchCandidate({
      ledgerPath: storePath,
      requestId: 'research-feishu-update-1',
      candidateIndex: 1,
      action: '转选题',
      decisionNote: '进入选题池。',
      feishuConfig: { tables: { researchRequests: { fields: researchRequestFields() } } },
      feishuClient: {
        async listRecords() { return [{ record_id: 'rec_research_2', fields: { 请求ID: 'research-feishu-update-1' } }]; },
        async updateRecord(tableName, recordId, fields) {
          updates.push({ tableName, recordId, fields });
        },
      },
    });

    assert.deepEqual(confirmed.feishu, { synced: true, action: 'updated', recordId: 'rec_research_2' });
    assert.equal(updates[0].fields.状态, '已转选题');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('research request sync uses an exact Feishu request ID lookup when available', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-feishu-filter-'));
  try {
    const calls = [];
    const result = await runResearchRequest({
      request: {
        requestId: 'research-feishu-filter-1',
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note' },
      },
      collect: async () => collectionFixture(),
      outputDir: join(dir, 'briefs'),
      ledgerPath: join(dir, 'research-requests.json'),
      feishuConfig: { tables: { researchRequests: { fields: researchRequestFields() } } },
      feishuClient: {
        async listRecordsByField(tableName, fieldName, value, selectedFields) {
          calls.push({ tableName, fieldName, value, selectedFields });
          return [{ record_id: 'rec_research_3', fields: { 请求ID: value } }];
        },
        async updateRecord() {},
      },
    });

    assert.deepEqual(result.feishu, { synced: true, action: 'updated', recordId: 'rec_research_3' });
    assert.deepEqual(calls, [{
      tableName: 'researchRequests', fieldName: '请求ID', value: 'research-feishu-filter-1', selectedFields: ['请求ID'],
    }]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function collectionFixture() {
  return {
    request: { mode: 'detail', platform: 'xiaohongshu', includeComments: true, limit: 10 },
    audit: { source: 'tikhub', requestCount: 2, cacheUrls: ['https://cache.example/note'] },
    contents: {
      fetchedCount: 1,
      createdCount: 1,
      duplicateCount: 0,
      items: [{
        uniqueKey: 'xiaohongshu:note-1',
        platform: 'xiaohongshu',
        creatorName: 'AI 实践者',
        contentExternalId: 'note-1',
        title: '企业 AI 先从一个流程试点',
        description: '先找到重复、可验收的流程。',
        url: 'https://example.com/note',
      }],
    },
    comments: {
      fetchedCount: 2,
      createdCount: 2,
      duplicateCount: 0,
      items: [
        { commentUniqueKey: 'xiaohongshu:x:1', commentText: '怎么判断先做哪个流程？', demandType: ['问题咨询'], likeCount: 5 },
        { commentUniqueKey: 'xiaohongshu:x:2', commentText: '能不能先做低成本试点？', demandType: ['购买意向'], likeCount: 3 },
      ],
    },
  };
}

function researchRequestFields() {
  return {
    requestId: '请求ID',
    purpose: '研究目的',
    serviceDirection: '服务方向',
    targetAccount: '目标账号',
    collectMode: '采集方式',
    platform: '平台',
    sampleLimit: '样本上限',
    contentCount: '内容样本数',
    commentCount: '评论样本数',
    requestCount: 'TikHub调用数',
    status: '状态',
    nextAction: '下一步',
    briefPath: '研究简报路径',
    createdAt: '创建时间',
    updatedAt: '更新时间',
  };
}
