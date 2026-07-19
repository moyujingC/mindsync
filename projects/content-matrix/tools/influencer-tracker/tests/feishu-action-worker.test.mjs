import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runFeishuActionWorker } from '../src/jobs/feishu-action-worker.mjs';

test('runFeishuActionWorker requires task field mapping', async () => {
  await assert.rejects(() => runFeishuActionWorker({
    loaded: {
      creators: [],
      feishuClient: {},
      feishuConfig: {
        tables: {
          creators: {
            fields: {
              name: '博主名称',
            },
          },
        },
      },
    },
    storePath: 'unused',
  }), /Missing creator task field mapping/);
});

test('worker-style task flow filters pending creators and reports backfill summary', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-worker-'));
  const storePath = join(dir, 'store.json');

  try {
    const updates = [];
    const creator = {
      id: 'rec_pending',
      recordId: 'rec_pending',
      name: '样例账号',
      platform: 'bilibili',
      externalId: '2',
      enabledStatus: '启用',
      collectAction: '待回溯',
      taskStatus: '空闲',
      collectSince: '2026-07-15T01:30:00.000Z',
      source: {
        kind: 'rss-file',
        path: 'fixtures/bilibili-rss.example.xml',
      },
    };
    const loaded = {
      creators: [
        creator,
        {
          ...creator,
          id: 'rec_idle',
          recordId: 'rec_idle',
          name: '空闲账号',
          collectAction: '无',
        },
      ],
      feishuClient: {
        async listRecords(tableName) {
          assert.equal(tableName, 'contents');
          return [];
        },
        async createRecords(tableName, records) {
          assert.equal(tableName, 'contents');
          assert.equal(records.length, 1);
          return ['rec_content_1'];
        },
        async updateRecord(tableName, recordId, fields) {
          updates.push({ tableName, recordId, fields });
        },
      },
      feishuConfig: {
        tables: {
          creators: {
            fields: creatorFields(),
          },
          contents: {
            fields: contentFields(),
          },
        },
      },
    };

    const result = await runFeishuActionWorker({
      loaded,
      storePath,
      limit: 20,
      dryRun: false,
      cwd: '/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker',
    });

    assert.equal(result.pendingCount, 1);
    assert.equal(result.successCount, 1);
    assert.equal(result.failedCount, 0);
    assert.match(result.results[0].summary, /回溯完成/);
    assert.equal(updates.length, 2);
    assert.equal(updates[0].fields['任务状态'], '执行中');
    assert.equal(updates[1].fields['采集动作'], '无');
    assert.equal(updates[1].fields['任务状态'], '完成');
    assert.match(updates[1].fields['任务报告'], /新增 1 条/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('worker resolves Bilibili creator homepage and fills tracking fields', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-worker-link-creator-'));
  const storePath = join(dir, 'store.json');

  try {
    const updates = [];
    const loaded = workerLoaded({
      creators: [{
        id: 'rec_link',
        recordId: 'rec_link',
        name: '待解析账号',
        enabledStatus: '启用',
        collectAction: '待解析链接',
        taskStatus: '空闲',
        homepageUrl: 'https://b23.tv/abc',
      }],
      updates,
    });

    const result = await runFeishuActionWorker({
      loaded,
      storePath,
      dryRun: false,
      resolveLink: async () => ({
        kind: 'creator',
        finalUrl: 'https://space.bilibili.com/123456789',
        platform: 'bilibili',
        externalId: '123456789',
        homepageUrl: 'https://space.bilibili.com/123456789',
        sourceKind: 'rss',
        sourcePath: 'https://rsshub.app/bilibili/user/video/123456789',
      }),
    });

    assert.equal(result.successCount, 1);
    assert.match(result.results[0].summary, /UID 123456789/);
    assert.equal(updates.at(-1).fields['平台'], 'bilibili');
    assert.equal(updates.at(-1).fields['平台账号ID'], '123456789');
    assert.equal(updates.at(-1).fields['主页链接'], 'https://space.bilibili.com/123456789');
    assert.equal(updates.at(-1).fields['链接类型'], '博主主页');
    assert.equal(updates.at(-1).fields['数据源类型'], 'rss');
    assert.equal(updates.at(-1).fields['数据源地址'], 'https://rsshub.app/bilibili/user/video/123456789');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('worker resolves Bilibili video link as reference content', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-worker-link-video-'));
  const storePath = join(dir, 'store.json');

  try {
    const updates = [];
    const createdRecords = [];
    const loaded = workerLoaded({
      creators: [{
        id: 'rec_video',
        recordId: 'rec_video',
        name: '视频链接行',
        enabledStatus: '启用',
        collectAction: '待解析链接',
        taskStatus: '空闲',
        sourceLink: 'https://b23.tv/video',
      }],
      updates,
      createdRecords,
    });

    const result = await runFeishuActionWorker({
      loaded,
      storePath,
      dryRun: false,
      resolveLink: async () => ({
        kind: 'content',
        finalUrl: 'https://www.bilibili.com/video/BV1abcDEF12',
        platform: 'bilibili',
        externalId: 'BV1abcDEF12',
        content: {
          platform: 'bilibili',
          creatorName: '随机发现',
          externalId: 'BV1abcDEF12',
          url: 'https://www.bilibili.com/video/BV1abcDEF12',
          title: 'B站随机发现内容 BV1abcDEF12',
          description: '自动导入',
          contentType: '视频',
        },
      }),
    });

    assert.equal(result.successCount, 1);
    assert.match(result.results[0].summary, /单条内容/);
    assert.equal(createdRecords.length, 1);
    assert.equal(createdRecords[0].records[0]['内容唯一键'], 'bilibili:BV1abcDEF12');
    assert.equal(createdRecords[0].records[0]['博主'], '随机发现');
    assert.equal(updates.at(-1).fields['链接类型'], '单条内容');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('worker imports multiline Bilibili BV references as content list', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-worker-bv-list-'));
  const storePath = join(dir, 'store.json');

  try {
    const updates = [];
    const createdRecords = [];
    const loaded = workerLoaded({
      creators: [{
        id: 'rec_bv_list',
        recordId: 'rec_bv_list',
        name: '第四种黑猩猩',
        enabledStatus: '启用',
        collectAction: '待解析链接',
        taskStatus: '空闲',
        sourceLink: [
          'BV166Ni6JESi',
          'https://www.bilibili.com/video/BV126M76EEPz',
          'BV166Ni6JESi',
        ].join('\n'),
      }],
      updates,
      createdRecords,
    });

    const result = await runFeishuActionWorker({
      loaded,
      storePath,
      dryRun: false,
    });

    assert.equal(result.successCount, 1);
    assert.match(result.results[0].summary, /内容列表 2 条/);
    assert.equal(createdRecords.length, 1);
    assert.deepEqual(createdRecords[0].records.map((record) => record['内容唯一键']), [
      'bilibili:BV166Ni6JESi',
      'bilibili:BV126M76EEPz',
    ]);
    assert.deepEqual(createdRecords[0].records.map((record) => record['博主']), [
      '第四种黑猩猩',
      '第四种黑猩猩',
    ]);
    assert.equal(updates.at(-1).fields['链接类型'], '单条内容');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('worker imports single Bilibili BV reference without network resolution', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-worker-single-bv-'));
  const storePath = join(dir, 'store.json');

  try {
    const updates = [];
    const createdRecords = [];
    const loaded = workerLoaded({
      creators: [{
        id: 'rec_single_bv',
        recordId: 'rec_single_bv',
        name: '第四种黑猩猩',
        enabledStatus: '启用',
        collectAction: '待解析链接',
        taskStatus: '空闲',
        sourceLink: 'BV166Ni6JESi',
      }],
      updates,
      createdRecords,
    });

    const result = await runFeishuActionWorker({
      loaded,
      storePath,
      dryRun: false,
      resolveLink: async () => {
        throw new Error('resolveLink should not be called for plain BV');
      },
    });

    assert.equal(result.successCount, 1);
    assert.equal(createdRecords[0].records[0]['内容唯一键'], 'bilibili:BV166Ni6JESi');
    assert.equal(updates.at(-1).fields['任务状态'], '完成');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('worker backfill normalizes manually typed Bilibili UID before collection', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-worker-uid-'));
  const storePath = join(dir, 'store.json');
  const rssPath = join(dir, 'rss.xml');

  try {
    await writeFile(rssPath, bilibiliRssXml(), 'utf8');
    const updates = [];
    const createdRecords = [];
    const loaded = workerLoaded({
      creators: [{
        id: 'rec_uid',
        recordId: 'rec_uid',
        name: '第四种黑猩猩',
        platform: 'bilibili',
        externalId: 'UID:3546830396721763',
        enabledStatus: '启用',
        collectAction: '待回溯',
        taskStatus: '空闲',
        collectSince: '2026-06-01T00:00:00.000Z',
        source: {
          kind: 'rss-file',
          path: rssPath,
        },
      }],
      updates,
      createdRecords,
    });

    const result = await runFeishuActionWorker({
      loaded,
      storePath,
      dryRun: false,
      limit: 10,
    });

    assert.equal(result.successCount, 1);
    assert.equal(createdRecords.length, 1);
    assert.equal(createdRecords[0].records[0]['博主'], '第四种黑猩猩');
    assert.equal(updates.at(-1).fields['平台账号ID'], '3546830396721763');
    assert.equal(updates.at(-1).fields['数据源地址'], 'https://rsshub.app/bilibili/user/video/3546830396721763');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('worker keeps normalized Bilibili fields when collection fails after preparation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-worker-prepared-fail-'));
  const storePath = join(dir, 'store.json');
  const originalFetch = globalThis.fetch;

  try {
    const updates = [];
    const loaded = workerLoaded({
      creators: [{
        id: 'rec_uid_fail',
        recordId: 'rec_uid_fail',
        name: '第四种黑猩猩',
        platform: 'bilibili',
        externalId: 'UID:3546830396721763',
        enabledStatus: '启用',
        collectAction: '待回溯',
        taskStatus: '空闲',
        collectSince: '2026-06-01T00:00:00.000Z',
      }],
      updates,
    });
    globalThis.fetch = async () => {
      const error = new TypeError('fetch failed');
      error.cause = { code: 'UND_ERR_CONNECT_TIMEOUT' };
      throw error;
    };

    const result = await runFeishuActionWorker({
      loaded,
      storePath,
      dryRun: false,
      limit: 10,
    });

    assert.equal(result.failedCount, 1);
    assert.match(result.results[0].error, /UND_ERR_CONNECT_TIMEOUT/);
    assert.equal(updates.at(-1).fields['任务状态'], '失败');
    assert.equal(updates.at(-1).fields['平台账号ID'], '3546830396721763');
    assert.equal(updates.at(-1).fields['数据源类型'], 'rss');
    assert.equal(updates.at(-1).fields['数据源地址'], 'https://rsshub.app/bilibili/user/video/3546830396721763');
  } finally {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  }
});

function creatorFields() {
  return {
    name: '博主名称',
    platform: '平台',
    externalId: '平台账号ID',
    homepageUrl: '主页链接',
    sourceLink: '来源链接',
    linkType: '链接类型',
    enabledStatus: '启用状态',
    checkFrequency: '检查频率',
    lastCheckedAt: '最近检查时间',
    latestContentAt: '最近内容时间',
    lastStatus: '最近状态',
    failureReason: '失败原因',
    sourceKind: '数据源类型',
    sourcePath: '数据源地址',
    collectAction: '采集动作',
    taskStatus: '任务状态',
    collectSince: '采集起始日期',
    taskReport: '任务报告',
    taskLockedAt: '任务锁定时间',
  };
}

function contentFields() {
  return {
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
}

function workerLoaded({ creators, updates, createdRecords = [] }) {
  return {
    creators,
    feishuClient: {
      async listRecords(tableName) {
        assert.equal(tableName, 'contents');
        return [];
      },
      async createRecords(tableName, records) {
        createdRecords.push({ tableName, records });
        return records.map((_, index) => `rec_content_${index}`);
      },
      async updateRecord(tableName, recordId, fields) {
        updates.push({ tableName, recordId, fields });
      },
    },
    feishuConfig: {
      tables: {
        creators: {
          fields: creatorFields(),
        },
        contents: {
          fields: contentFields(),
        },
      },
    },
  };
}

function bilibiliRssXml() {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <item>
      <title>测试视频</title>
      <link>https://www.bilibili.com/video/BV1uidTEST1</link>
      <guid>https://www.bilibili.com/video/BV1uidTEST1</guid>
      <pubDate>Mon, 15 Jun 2026 01:00:00 GMT</pubDate>
      <description><![CDATA[测试简介]]></description>
    </item>
  </channel>
</rss>`;
}
