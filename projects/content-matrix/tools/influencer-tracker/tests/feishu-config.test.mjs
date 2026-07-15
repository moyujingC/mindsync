import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFeishuConfig, validateFeishuTableFields } from '../src/feishu/config.mjs';
import { mapContentToFeishuFields, mapFeishuCreatorRecord } from '../src/feishu/client.mjs';

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
    },
  });

  assert.equal(result.ok, true);
});

test('mapFeishuCreatorRecord normalizes single-select-like fields', () => {
  const creator = mapFeishuCreatorRecord({
    record_id: 'rec_1',
    fields: {
      博主名称: '测试账号',
      平台: { text: 'bilibili' },
      平台账号ID: '2',
      主页链接: { link: 'https://space.bilibili.com/2' },
      启用状态: { text: '启用' },
      检查频率: { text: '每日' },
      数据源类型: 'rss-file',
      数据源地址: 'fixtures/bilibili-rss.example.xml',
    },
  }, fields);

  assert.equal(creator.recordId, 'rec_1');
  assert.equal(creator.platform, 'bilibili');
  assert.equal(creator.enabledStatus, '启用');
  assert.equal(creator.homepageUrl, 'https://space.bilibili.com/2');
  assert.deepEqual(creator.source, {
    kind: 'rss-file',
    path: 'fixtures/bilibili-rss.example.xml',
  });
});

test('mapContentToFeishuFields maps normalized content to table fields', () => {
  const fieldsForWrite = mapContentToFeishuFields({
    uniqueKey: 'bilibili:BV1',
    platform: 'bilibili',
    contentExternalId: 'BV1',
    url: 'https://www.bilibili.com/video/BV1',
    title: '标题',
    description: '简介',
    publishedAt: '2026-07-15T01:00:00.000Z',
    contentType: 'video',
    tags: ['AI'],
    metrics: {
      likeCount: 1,
      commentCount: 2,
      favoriteCount: 3,
      shareCount: 4,
    },
  }, contentFields);

  assert.equal(fieldsForWrite['内容唯一键'], 'bilibili:BV1');
  assert.deepEqual(fieldsForWrite['内容链接'], {
    link: 'https://www.bilibili.com/video/BV1',
    text: 'https://www.bilibili.com/video/BV1',
  });
  assert.equal(fieldsForWrite['分析状态'], '待分析');
  assert.equal(fieldsForWrite['点赞数'], 1);
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
    },
  };
  const actualFieldsByTable = {
    creators: Object.values(fields).map((fieldName) => ({ fieldName })),
    contents: Object.values(contentFields)
      .filter((fieldName) => fieldName !== '标题')
      .map((fieldName) => ({ fieldName })),
  };

  const result = validateFeishuTableFields(config, actualFieldsByTable);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /contents.title -> 标题/);
});
