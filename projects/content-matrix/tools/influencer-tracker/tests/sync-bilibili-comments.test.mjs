import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readJsonFile } from '../src/utils/json-file.mjs';
import { mapCommentToFeishuFields, mapFeishuCommentRecord } from '../src/feishu/client.mjs';
import { syncBilibiliComments, normalizeBilibiliComments } from '../src/jobs/sync-bilibili-comments.mjs';

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

test('normalizeBilibiliComments creates stable comment keys', async () => {
  const fixture = await readJsonFile(new URL('../fixtures/bilibili-comments.example.json', import.meta.url));
  const comments = normalizeBilibiliComments(fixture);

  assert.equal(comments.length, 2);
  assert.equal(comments[0].commentUniqueKey, 'bilibili:bilibili:BV1sample001:1001');
  assert.deepEqual(comments[0].demandType, ['问题咨询', '购买意向']);
});

test('mapCommentToFeishuFields maps comment record for write', () => {
  const fields = mapCommentToFeishuFields({
    commentUniqueKey: 'bilibili:bilibili:BV1sample001:1001',
    contentUniqueKey: 'bilibili:BV1sample001',
    commentText: '测试评论',
    commentedAt: '2026-07-15T01:10:00.000Z',
    likeCount: 12,
    userHandle: '用户A',
    demandType: ['问题咨询'],
    sentiment: '中性',
    insightStatus: '待定',
  }, commentFields);

  assert.equal(fields['评论唯一键'], 'bilibili:bilibili:BV1sample001:1001');
  assert.deepEqual(fields['需求类型'], ['问题咨询']);
  assert.equal(fields['情绪倾向'], '中性');
});

test('mapFeishuCommentRecord normalizes comment record from Feishu', () => {
  const comment = mapFeishuCommentRecord({
    record_id: 'rec_comment_1',
    fields: {
      评论唯一键: 'bilibili:bilibili:BV1sample001:1001',
      内容唯一键: 'bilibili:BV1sample001',
      评论文本: '测试评论',
      评论时间: '2026-07-15T01:10:00.000Z',
      点赞数: 12,
      用户标识: '用户A',
      需求类型: [{ text: '问题咨询' }],
      情绪倾向: { text: '中性' },
      是否进入洞察: { text: '待定' },
    },
  }, commentFields);

  assert.equal(comment.recordId, 'rec_comment_1');
  assert.equal(comment.commentUniqueKey, 'bilibili:bilibili:BV1sample001:1001');
  assert.deepEqual(comment.demandType, ['问题咨询']);
});

test('syncBilibiliComments deduplicates existing comment keys from Feishu', async () => {
  const createdPayloads = [];
  const feishuClient = {
    async listRecords() {
      return [{
        record_id: 'rec_existing',
        fields: {
          评论唯一键: 'bilibili:bilibili:BV1sample001:1001',
        },
      }];
    },
    async createRecords(tableName, records) {
      createdPayloads.push({ tableName, records });
      return ['rec_new_1'];
    },
  };

  const result = await syncBilibiliComments({
    inputPath: 'fixtures/bilibili-comments.example.json',
    feishuClient,
    feishuConfig: {
      tables: {
        comments: {
          fields: commentFields,
        },
      },
    },
    dryRun: false,
    cwd: new URL('../', import.meta.url).pathname,
  });

  assert.equal(result.inputCount, 2);
  assert.equal(result.createdCount, 1);
  assert.equal(result.duplicateCount, 1);
  assert.equal(createdPayloads.length, 1);
  assert.equal(createdPayloads[0].tableName, 'comments');
  assert.equal(createdPayloads[0].records[0]['评论唯一键'], 'bilibili:bilibili:BV1sample001:1002');
});

test('syncBilibiliComments can write comments manifest into artifact directory', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-comments-manifest-'));

  try {
    const result = await syncBilibiliComments({
      inputPath: 'fixtures/bilibili-comments.example.json',
      artifactDir: dir,
      dryRun: true,
      cwd: new URL('../', import.meta.url).pathname,
    });

    const manifest = JSON.parse(await readFile(join(dir, 'comments-manifest.json'), 'utf8'));
    assert.equal(result.createdCount, 2);
    assert.equal(manifest.job, 'comments');
    assert.equal(manifest.output.createdCount, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
