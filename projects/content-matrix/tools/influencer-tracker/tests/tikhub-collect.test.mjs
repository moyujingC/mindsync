import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectTikHubResearch } from '../src/jobs/tikhub-collect.mjs';

const feishuConfig = {
  tables: {
    creators: { fields: creatorFields() },
    contents: { fields: contentFields() },
    comments: { fields: commentFields() },
  },
};

test('collectTikHubResearch imports one Xiaohongshu link and its comments into Feishu', async () => {
  const writes = [];
  const result = await withStore(async (storePath) => collectTikHubResearch({
    request: {
      mode: 'detail',
      platform: 'xiaohongshu',
      shareUrl: 'https://www.xiaohongshu.com/explore/xhs-001',
      includeComments: true,
    },
    client: fakeClient(),
    feishuClient: fakeFeishuClient(writes),
    feishuConfig,
    storePath,
  }));

  assert.equal(result.contents.createdCount, 1);
  assert.equal(result.creators.createdCount, 1);
  assert.equal(result.comments.createdCount, 1);
  assert.equal(result.audit.requestCount, 2);
  assert.deepEqual(writes.map((item) => item.tableName), ['creators', 'contents', 'comments']);
  assert.equal(writes[0].records[0]['平台'], '小红书');
  assert.equal(writes[1].records[0]['内容唯一键'], 'xiaohongshu:xhs-001');
  assert.equal(writes[1].records[0]['平台'], '小红书');
  assert.equal(writes[2].records[0]['内容唯一键'], 'xiaohongshu:xhs-001');
});

test('collectTikHubResearch limits keyword results and skips previously stored content', async () => {
  const writes = [];
  await withStore(async (storePath) => {
    const first = await collectTikHubResearch({
      request: { mode: 'search', platform: 'douyin', keyword: '企业 AI', limit: 1 },
      client: fakeClient(),
      feishuClient: fakeFeishuClient(writes),
      feishuConfig,
      storePath,
    });
    const second = await collectTikHubResearch({
      request: { mode: 'search', platform: 'douyin', keyword: '企业 AI', limit: 1 },
      client: fakeClient(),
      feishuClient: fakeFeishuClient(writes),
      feishuConfig,
      storePath,
    });

    assert.equal(first.contents.createdCount, 1);
    assert.equal(second.contents.createdCount, 0);
    assert.equal(second.contents.duplicateCount, 1);
  });
});

test('collectTikHubResearch follows content cursors until the requested total sample limit', async () => {
  const calls = [];
  const client = {
    async searchContents({ cursor }) {
      calls.push(cursor);
      if (!cursor) {
        return response({
          items: [douyinContent()],
          has_more: true,
          cursor: 'page-2',
        }, 1);
      }
      return response({
        items: [{ ...douyinContent(), aweme_id: 'dy-002' }],
        has_more: false,
      }, 2);
    },
  };

  const result = await withStore((storePath) => collectTikHubResearch({
    request: { mode: 'search', platform: 'douyin', keyword: '企业 AI', limit: 2 },
    client,
    storePath,
    dryRun: true,
  }));

  assert.deepEqual(calls, [null, 'page-2']);
  assert.equal(result.contents.fetchedCount, 2);
  assert.equal(result.audit.pagination.contents.pageCount, 2);
  assert.equal(result.audit.pagination.contents.stoppedReason, 'source-exhausted');
});

test('collectTikHubResearch stops when TikHub repeats a cursor instead of looping', async () => {
  let calls = 0;
  const client = {
    async getCreatorContents() {
      calls += 1;
      return response({
        items: [{ ...douyinContent(), aweme_id: `dy-${calls}` }],
        has_more: true,
        cursor: 'same-cursor',
      }, calls);
    },
  };

  const result = await withStore((storePath) => collectTikHubResearch({
    request: { mode: 'creator', platform: 'douyin', creatorId: 'creator-1', limit: 5 },
    client,
    storePath,
    dryRun: true,
  }));

  assert.equal(calls, 2);
  assert.equal(result.contents.fetchedCount, 2);
  assert.equal(result.audit.pagination.contents.stoppedReason, 'invalid-or-repeated-cursor');
});

test('collectTikHubResearch expands comments only when an explicit comment page limit is set', async () => {
  const cursors = [];
  const client = {
    async getContentDetail() {
      return response(xhsContent(), 1);
    },
    async getComments({ cursor }) {
      cursors.push(cursor);
      if (!cursor) {
        return response({
          comments: [{ id: 'comment-001', content: '第一条评论' }],
          has_more: true,
          cursor: 'comment-page-2',
        }, 2);
      }
      return response({
        comments: [{ id: 'comment-002', content: '第二条评论' }],
        has_more: false,
      }, 3);
    },
  };

  const result = await withStore((storePath) => collectTikHubResearch({
    request: {
      mode: 'detail',
      platform: 'xiaohongshu',
      shareUrl: 'https://example.com/xhs-001',
      includeComments: true,
      commentLimit: 2,
      commentPages: 2,
    },
    client,
    storePath,
    dryRun: true,
  }));

  assert.deepEqual(cursors, [null, 'comment-page-2']);
  assert.equal(result.comments.fetchedCount, 2);
  assert.equal(result.audit.pagination.comments[0].pageCount, 2);
});

test('collectTikHubResearch keeps comments to one page by default', async () => {
  const cursors = [];
  const client = {
    async getContentDetail() {
      return response(xhsContent(), 1);
    },
    async getComments({ cursor }) {
      cursors.push(cursor);
      return response({
        comments: [{ id: 'comment-001', content: '默认只采这一页' }],
        has_more: true,
        cursor: 'comment-page-2',
      }, 2);
    },
  };

  const result = await withStore((storePath) => collectTikHubResearch({
    request: {
      mode: 'detail',
      platform: 'xiaohongshu',
      shareUrl: 'https://example.com/xhs-001',
      includeComments: true,
    },
    client,
    storePath,
    dryRun: true,
  }));

  assert.deepEqual(cursors, [null]);
  assert.equal(result.comments.fetchedCount, 1);
  assert.equal(result.audit.pagination.comments[0].stoppedReason, 'max-pages-reached');
});

function fakeClient() {
  return {
    async getContentDetail() {
      return { data: xhsContent(), cacheUrl: 'https://cache.example/detail', audit: { requestCount: 1 } };
    },
    async getComments() {
      return { data: { comments: [{ id: 'comment-001', content: '这个流程怎么选？', user: { nickname: '用户甲' }, like_count: 4 }] }, cacheUrl: 'https://cache.example/comments', audit: { requestCount: 2 } };
    },
    async searchContents() {
      return { data: { items: [douyinContent(), { ...douyinContent(), aweme_id: 'dy-002' }] }, cacheUrl: 'https://cache.example/search', audit: { requestCount: 1 } };
    },
    async getCreatorContents() {
      return { data: { items: [douyinContent()] }, cacheUrl: 'https://cache.example/creator', audit: { requestCount: 1 } };
    },
  };
}

function response(data, requestCount) {
  return {
    data,
    cacheUrl: `https://cache.example/${requestCount}`,
    audit: { requestCount },
  };
}

function fakeFeishuClient(writes) {
  return {
    async listRecords() {
      return [];
    },
    async createRecords(tableName, records) {
      writes.push({ tableName, records });
      return records.map((_, index) => `rec_${tableName}_${index}`);
    },
  };
}

function xhsContent() {
  return {
    note_id: 'xhs-001',
    title: '企业 AI 从哪个流程开始试点',
    desc: '从一个流程开始。',
    user: { nickname: 'AI 实践者', user_id: 'xhs-user-001' },
    interact_info: { liked_count: 8, comment_count: 1 },
    time: 1_784_041_200,
    type: 'normal',
    url: 'https://www.xiaohongshu.com/explore/xhs-001',
  };
}

function douyinContent() {
  return {
    aweme_id: 'dy-001',
    desc: '企业 AI 先做一个真实流程。',
    author: { nickname: '企业 AI 顾问', sec_uid: 'sec-001' },
    statistics: { digg_count: 30, comment_count: 4 },
    create_time: 1_784_041_200,
    share_url: 'https://www.douyin.com/video/dy-001',
  };
}

function contentFields() {
  return { uniqueKey: '内容唯一键', platform: '平台', creator: '博主', externalId: '内容ID', url: '内容链接', title: '标题', description: '正文/简介', publishedAt: '发布时间', collectedAt: '采集时间', contentType: '内容类型', tags: '标签', likeCount: '点赞数', commentCount: '评论数', favoriteCount: '收藏数', shareCount: '转发/分享数', analysisStatus: '分析状态' };
}

function creatorFields() {
  return { name: '博主名称', platform: '平台', externalId: '平台账号ID', homepageUrl: '主页链接', sourceLink: '来源链接', linkType: '链接类型', enabledStatus: '启用状态', checkFrequency: '检查频率', lastCheckedAt: '最近检查时间', latestContentAt: '最近内容时间', lastStatus: '最近状态', failureReason: '失败原因', sourceKind: '数据源类型', sourcePath: '数据源地址' };
}

function commentFields() {
  return { commentKey: '评论唯一键', contentKey: '内容唯一键', commentText: '评论文本', commentedAt: '评论时间', likeCount: '点赞数', userHandle: '用户标识', demandType: '需求类型', sentiment: '情绪倾向', insightStatus: '是否进入洞察' };
}

async function withStore(run) {
  const dir = await mkdtemp(join(tmpdir(), 'tikhub-collect-'));
  try {
    return await run(join(dir, 'store.json'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
