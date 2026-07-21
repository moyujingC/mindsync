import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runManualResearchRequest } from '../src/jobs/manual-research.mjs';

test('manual research turns a random reference and pasted comments into a traceable research request without TikHub', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'manual-research-'));
  try {
    const writes = [];
    const result = await runManualResearchRequest({
      request: {
        requestId: 'manual-research-1',
        templateId: 'enterprise_ai_service',
        collect: { mode: 'manual', platform: '小红书', includeComments: true },
      },
      items: [manualItem()],
      storePath: join(dir, 'content-store.json'),
      ledgerPath: join(dir, 'research-requests.json'),
      outputDir: join(dir, 'briefs'),
      feishuConfig: feishuConfig(),
      feishuClient: fakeFeishu(writes),
    });

    assert.equal(result.collection.requestCount, 0);
    assert.equal(result.collection.platform, 'xiaohongshu');
    assert.equal(result.collection.contentCount, 1);
    assert.equal(result.collection.commentCount, 2);
    assert.equal(result.candidates[0].evidenceLevel, '观察');
    assert.equal(result.candidates[0].source.contentUniqueKey, 'xiaohongshu:www.xiaohongshu.com/explore/random-note-1');
    assert.deepEqual(writes.map((write) => write.tableName), ['contents', 'comments', 'researchRequests']);
    const brief = await readFile(result.outputPath, 'utf8');
    assert.match(brief, /TikHub 调用：0/);
    assert.match(brief, /怎么判断资料能不能用于知识库/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('manual research does not re-import or re-write comments when the request already exists', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'manual-research-retry-'));
  try {
    const writes = [];
    const first = await runManualResearchRequest({
      request: {
        requestId: 'manual-research-retry-1',
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'manual', platform: '小红书', includeComments: true },
      },
      items: [manualItem()],
      storePath: join(dir, 'content-store.json'),
      ledgerPath: join(dir, 'research-requests.json'),
      outputDir: join(dir, 'briefs'),
      feishuConfig: feishuConfig(),
      feishuClient: fakeFeishu(writes),
    });
    const retry = await runManualResearchRequest({
      request: {
        requestId: 'manual-research-retry-1',
        purpose: 'ignored',
        serviceDirection: 'ignored',
        collect: { mode: 'manual', platform: '小红书', includeComments: true },
      },
      items: [manualItem()],
      storePath: join(dir, 'content-store.json'),
      ledgerPath: join(dir, 'research-requests.json'),
      outputDir: join(dir, 'briefs'),
      feishuConfig: feishuConfig(),
      feishuClient: fakeFeishu(writes),
    });

    assert.equal(retry.outputPath, first.outputPath);
    assert.deepEqual(writes.map((write) => write.tableName), ['contents', 'comments', 'researchRequests', 'researchRequests']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('manual research does not parse or write comments until includeComments is explicit', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'manual-research-no-comments-'));
  try {
    const writes = [];
    const result = await runManualResearchRequest({
      request: {
        requestId: 'manual-research-2',
        purpose: '收藏整理',
        serviceDirection: '墨予镜',
        targetAccount: '墨予镜',
        collect: { mode: 'manual', platform: '小红书', includeComments: false },
      },
      items: [manualItem({ comments: 'not-an-array' })],
      storePath: join(dir, 'content-store.json'),
      ledgerPath: join(dir, 'research-requests.json'),
      outputDir: join(dir, 'briefs'),
      feishuConfig: feishuConfig(),
      feishuClient: fakeFeishu(writes),
    });

    assert.equal(result.collection.commentCount, 0);
    assert.equal(result.candidates[0].evidenceLevel, '线索');
    assert.deepEqual(writes.map((write) => write.tableName), ['contents', 'researchRequests']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('manual research dry-run returns candidates without writing a ledger, brief, or Feishu record', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'manual-research-dry-run-'));
  try {
    const writes = [];
    const result = await runManualResearchRequest({
      request: {
        requestId: 'manual-research-dry-run-1',
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'manual', platform: '小红书', includeComments: true },
      },
      items: [manualItem()],
      storePath: join(dir, 'content-store.json'),
      ledgerPath: join(dir, 'research-requests.json'),
      outputDir: join(dir, 'briefs'),
      feishuConfig: feishuConfig(),
      feishuClient: fakeFeishu(writes),
      dryRun: true,
    });

    assert.equal(result.outputPath, null);
    assert.equal(result.collection.requestCount, 0);
    assert.equal(result.candidates.length, 1);
    assert.deepEqual(writes, []);
    await assert.rejects(access(join(dir, 'content-store.json')), /ENOENT/);
    await assert.rejects(access(join(dir, 'research-requests.json')), /ENOENT/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('manual research uses a refined transcript as local evidence without sending its body to Feishu', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'manual-research-transcript-'));
  try {
    const transcriptPath = join(dir, 'sample.refined.txt');
    const transcript = '企业资料散落在多个系统，团队想先梳理一个可验收的知识库试点。';
    await writeFile(transcriptPath, transcript, 'utf8');
    const writes = [];
    const result = await runManualResearchRequest({
      request: {
        requestId: 'manual-research-transcript-1',
        templateId: 'enterprise_ai_service',
        collect: { mode: 'manual', platform: '小红书', includeComments: false },
      },
      items: [manualItem({ description: '', comments: [], refinedTextPath: transcriptPath })],
      storePath: join(dir, 'content-store.json'),
      ledgerPath: join(dir, 'research-requests.json'),
      outputDir: join(dir, 'briefs'),
      feishuConfig: feishuConfig(),
      feishuClient: fakeFeishu(writes),
    });

    assert.match(result.candidates[0].userProblem, /资料散落/);
    assert.equal(result.candidates[0].source.refinedText.path, transcriptPath);
    assert.equal(result.candidates[0].evidence.transcriptExcerpt, transcript);
    const serializedWrites = JSON.stringify(writes);
    assert.doesNotMatch(serializedWrites, new RegExp(transcript));
    const brief = await readFile(result.outputPath, 'utf8');
    assert.match(brief, /提纯文本：/);
    assert.match(brief, /提纯片段：企业资料散落/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('manual research reports a missing refined transcript path clearly', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'manual-research-missing-transcript-'));
  try {
    await assert.rejects(
      () => runManualResearchRequest({
        request: {
          requestId: 'manual-research-missing-transcript-1',
          purpose: '收藏整理',
          serviceDirection: '墨予镜',
          collect: { mode: 'manual', platform: '小红书', includeComments: false },
        },
        items: [manualItem({ refinedTextPath: 'missing.refined.txt' })],
        inputPath: join(dir, 'input.json'),
        storePath: join(dir, 'content-store.json'),
        ledgerPath: join(dir, 'research-requests.json'),
        outputDir: join(dir, 'briefs'),
      }),
      /Refined text file not found.*missing\.refined\.txt/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function manualItem(overrides = {}) {
  return {
    platform: '小红书',
    url: 'https://www.xiaohongshu.com/explore/random-note-1',
    title: '随机刷到的知识库治理案例',
    description: '这条公开内容可作为企业 AI 服务研究样本。',
    comments: [
      { id: 'comment-1', text: '怎么判断资料能不能用于知识库？', demandType: ['问题咨询'], likeCount: 4 },
      { id: 'comment-2', text: '我们团队资料太乱了，想先试小范围。', demandType: ['痛点抱怨'], likeCount: 2 },
    ],
    ...overrides,
  };
}

function feishuConfig() {
  return {
    tables: {
      contents: { fields: { uniqueKey: '内容唯一键', platform: '平台', creator: '博主', externalId: '内容ID', url: '内容链接', title: '标题', description: '正文/简介', publishedAt: '发布时间', collectedAt: '采集时间', contentType: '内容类型', tags: '标签', likeCount: '点赞数', commentCount: '评论数', favoriteCount: '收藏数', shareCount: '转发/分享数', analysisStatus: '分析状态' } },
      comments: { fields: { commentKey: '评论唯一键', contentKey: '内容唯一键', commentText: '评论文本', commentedAt: '评论时间', likeCount: '点赞数', userHandle: '用户标识', demandType: '需求类型', sentiment: '情绪倾向', insightStatus: '是否进入洞察' } },
      researchRequests: { fields: { requestId: '请求ID', purpose: '研究目的', serviceDirection: '服务方向', targetAccount: '目标账号', collectMode: '采集方式', platform: '平台', sampleLimit: '样本上限', contentCount: '内容样本数', commentCount: '评论样本数', requestCount: 'TikHub调用数', status: '状态', nextAction: '下一步', briefPath: '研究简报路径', createdAt: '创建时间', updatedAt: '更新时间' } },
    },
  };
}

function fakeFeishu(writes) {
  return {
    async listRecords() { return []; },
    async createRecords(tableName, records) {
      writes.push({ tableName, records });
      return [`rec_${tableName}`];
    },
  };
}
