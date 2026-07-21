import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFeishuConfig, validateFeishuTableFields } from '../src/feishu/config.mjs';
import { mapCommentToFeishuFields, mapContentToFeishuFields, mapFeishuCreatorRecord, mapResearchRequestToFeishuFields } from '../src/feishu/client.mjs';

const fields = {
  name: '博主名称',
  platform: '平台',
  externalId: '平台账号ID',
  homepageUrl: '主页链接',
  enabledStatus: '启用状态',
  checkFrequency: '检查频率',
  lastCheckedAt: '最近检查时间',
  latestContentAt: '最近内容时间',
  lastStatus: '最近状态',
  failureReason: '失败原因',
  sourceKind: '数据源类型',
  sourcePath: '数据源地址',
};

const contentFields = {
  uniqueKey: '内容唯一键',
  platform: '平台',
  creator: '博主',
  externalId: '内容ID',
  url: '内容链接',
  title: '标题',
  description: '正文/简介',
  publishedAt: '发布时间',
  collectedAt: '采集时间',
  contentType: '内容类型',
  tags: '标签',
  likeCount: '点赞数',
  commentCount: '评论数',
  favoriteCount: '收藏数',
  shareCount: '转发/分享数',
  analysisStatus: '分析状态',
};

const insightFields = {
  title: '洞察标题',
  sourceContentKeys: '来源内容',
  sourceCommentKeys: '来源评论',
  insightType: '洞察类型',
  targetAccounts: '适用账号',
  evidenceSummary: '证据摘要',
  nextAction: '建议动作',
  status: '状态',
};

const commentFields = {
  commentKey: '评论唯一键',
  contentKey: '内容唯一键',
  commentText: '评论文本',
  commentedAt: '评论时间',
  likeCount: '点赞数',
  userHandle: '用户标识',
  demandType: '需求类型',
  sentiment: '情绪倾向',
  insightStatus: '是否进入洞察',
};

const researchRequestFields = {
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

test('validateFeishuConfig reports missing values', () => {
  const result = validateFeishuConfig({
    appId: 'cli_xxx',
    tables: {},
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /appSecret/);
  assert.match(result.errors.join('\n'), /baseAppToken/);
  assert.match(result.errors.join('\n'), /creators/);
  assert.match(result.errors.join('\n'), /contents/);
});

test('validateFeishuConfig accepts complete config shape', () => {
  const result = validateFeishuConfig({
    appId: 'cli_xxx',
    appSecret: 'secret',
    baseAppToken: 'base',
    tables: {
      creators: {
        tableId: 'tbl_creators',
        fields,
      },
      contents: {
        tableId: 'tbl_contents',
        fields: contentFields,
      },
      comments: {
        tableId: 'tbl_comments',
        fields: commentFields,
      },
      insights: {
        tableId: 'tbl_insights',
        fields: insightFields,
      },
      researchRequests: {
        tableId: 'tbl_research_requests',
        fields: researchRequestFields,
      },
    },
  });

  assert.equal(result.ok, true);
});

test('mapResearchRequestToFeishuFields maps the ledger contract to the request table', () => {
  const fieldsForWrite = mapResearchRequestToFeishuFields({
    requestId: 'research-001',
    purpose: '评论挖需求',
    serviceDirection: '企业 AI 服务',
    targetAccount: '墨予镜',
    collection: {
      mode: 'search',
      platform: 'xiaohongshu',
      sampleLimit: 10,
      contentCount: 3,
      commentCount: 5,
      requestCount: 2,
    },
    status: '待人工确认',
    nextAction: '人工确认后再进入选题。',
    outputPath: '/tmp/research-001.md',
    generatedAt: '2026-07-21T10:00:00.000Z',
  }, researchRequestFields);

  assert.equal(fieldsForWrite['请求ID'], 'research-001');
  assert.equal(fieldsForWrite['采集方式'], '关键词搜索');
  assert.equal(fieldsForWrite['平台'], '小红书');
  assert.equal(fieldsForWrite['评论样本数'], 5);
  assert.equal(fieldsForWrite['状态'], '待人工确认');
  assert.equal(fieldsForWrite['研究简报路径'], undefined);
});

test('mapResearchRequestToFeishuFields keeps project-local brief paths relative', () => {
  const fieldsForWrite = mapResearchRequestToFeishuFields({
    requestId: 'research-local-path',
    purpose: '收藏整理',
    serviceDirection: '墨予镜',
    collection: { mode: 'detail', platform: 'xiaohongshu' },
    status: '待人工确认',
    nextAction: '人工确认。',
    outputPath: `${process.cwd()}/logs/research-briefs/research-local-path.md`,
    generatedAt: '2026-07-21T10:00:00.000Z',
  }, researchRequestFields);

  assert.equal(fieldsForWrite['研究简报路径'], 'logs/research-briefs/research-local-path.md');
});

test('mapFeishuCreatorRecord normalizes single-select-like fields', () => {
  const creator = mapFeishuCreatorRecord({
    record_id: 'rec_1',
    fields: {
      博主名称: '测试账号',
      平台: { text: '小红书' },
      平台账号ID: 'xhs-user-001',
      主页链接: { link: 'https://www.xiaohongshu.com/user/profile/xhs-user-001' },
      启用状态: { text: '启用' },
      检查频率: { text: '每日' },
      数据源类型: 'TikHub',
      数据源地址: 'TikHub',
    },
  }, fields);

  assert.equal(creator.recordId, 'rec_1');
  assert.equal(creator.platform, '小红书');
  assert.equal(creator.enabledStatus, '启用');
  assert.equal(creator.homepageUrl, 'https://www.xiaohongshu.com/user/profile/xhs-user-001');
});

test('mapContentToFeishuFields maps normalized content to table fields', () => {
  const fieldsForWrite = mapContentToFeishuFields({
    uniqueKey: 'xiaohongshu:xhs-001',
    platform: 'xiaohongshu',
    creatorName: '小红书样例账号',
    contentExternalId: 'xhs-001',
    url: 'https://www.xiaohongshu.com/explore/xhs-001',
    title: '标题',
    description: '简介',
    publishedAt: '2026-07-15T01:00:00.000Z',
    contentType: '图文',
    tags: ['AI'],
    metrics: {
      likeCount: 1,
      commentCount: 2,
      favoriteCount: 3,
      shareCount: 4,
    },
  }, contentFields);

  assert.equal(fieldsForWrite['内容唯一键'], 'xiaohongshu:xhs-001');
  assert.equal(fieldsForWrite['平台'], '小红书');
  assert.equal(fieldsForWrite['博主'], '小红书样例账号');
  assert.deepEqual(fieldsForWrite['内容链接'], {
    link: 'https://www.xiaohongshu.com/explore/xhs-001',
    text: 'https://www.xiaohongshu.com/explore/xhs-001',
  });
  assert.equal(fieldsForWrite['分析状态'], '待分析');
  assert.equal(fieldsForWrite['点赞数'], 1);
});

test('mapCommentToFeishuFields maps normalized comment fields', () => {
  const fieldsForWrite = mapCommentToFeishuFields({
    commentUniqueKey: 'bilibili:bilibili:BV1sample001:1001',
    contentUniqueKey: 'bilibili:BV1sample001',
    commentText: '测试评论',
    commentedAt: '2026-07-15T01:10:00.000Z',
    likeCount: 2,
    userHandle: '用户A',
    demandType: ['问题咨询'],
    sentiment: '中性',
    insightStatus: '待定',
  }, commentFields);

  assert.equal(fieldsForWrite['评论唯一键'], 'bilibili:bilibili:BV1sample001:1001');
  assert.equal(fieldsForWrite['内容唯一键'], 'bilibili:BV1sample001');
  assert.deepEqual(fieldsForWrite['需求类型'], ['问题咨询']);
});

test('validateFeishuTableFields checks mapped field names against live schema summary', () => {
  const config = {
    appId: 'cli_xxx',
    appSecret: 'secret',
    baseAppToken: 'base',
    tables: {
      creators: {
        tableId: 'tbl_creators',
        fields,
      },
      contents: {
        tableId: 'tbl_contents',
        fields: contentFields,
      },
      comments: {
        tableId: 'tbl_comments',
        fields: commentFields,
      },
      insights: {
        tableId: 'tbl_insights',
        fields: insightFields,
      },
      researchRequests: {
        tableId: 'tbl_research_requests',
        fields: researchRequestFields,
      },
    },
  };
  const actualFieldsByTable = {
    creators: Object.values(fields).map((fieldName) => ({ fieldName })),
    contents: Object.values(contentFields)
      .filter((fieldName) => fieldName !== '标题')
      .map((fieldName) => ({ fieldName })),
    comments: Object.values(commentFields).map((fieldName) => ({ fieldName })),
    insights: Object.values(insightFields).map((fieldName) => ({ fieldName })),
    researchRequests: Object.values(researchRequestFields).map((fieldName) => ({ fieldName })),
  };

  const result = validateFeishuTableFields(config, actualFieldsByTable);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /contents.title -> 标题/);
});
