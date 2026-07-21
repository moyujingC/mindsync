import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mapTopicCandidateToFeishuFields } from '../src/feishu/client.mjs';
import { writeTopicCandidatesToFeishu } from '../src/jobs/write-topic-candidates.mjs';

test('mapTopicCandidateToFeishuFields maps candidate to insights table fields', () => {
  const fields = mapTopicCandidateToFeishuFields({
    topicTitle: '从内容看 AI 工作流诊断需求',
    serviceDirection: 'AI 工作流诊断',
    userProblem: '重复流程多，但不知道从哪里开始。',
    evidenceSummary: '来源账号发布了相关内容。',
    nextAction: '人工查看原内容和评论区。',
    cta: '拿一个小样本判断适不适合做 AI 小实验。',
    source: {
      contentUniqueKey: 'douyin:dy-001',
    },
  }, {
    title: '洞察标题',
    sourceContentKeys: '来源内容',
    sourceCommentKeys: '来源评论',
    insightType: '洞察类型',
    targetAccounts: '适用账号',
    evidenceSummary: '证据摘要',
    nextAction: '建议动作',
    status: '状态',
  });

  assert.equal(fields.洞察标题, '从内容看 AI 工作流诊断需求');
  assert.equal(fields.来源内容, 'douyin:dy-001');
  assert.equal(fields.洞察类型, '选题');
  assert.deepEqual(fields.适用账号, ['墨予镜']);
  assert.equal(fields.状态, '待处理');
  assert.match(fields.建议动作, /用户问题/);
});

test('writeTopicCandidatesToFeishu writes candidates to insights table with lark-cli client', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-topic-write-'));
  const fakeCliPath = join(dir, 'fake-lark-cli.mjs');
  const feishuPath = join(dir, 'feishu.json');

  await writeFile(fakeCliPath, `#!/usr/bin/env node
if (process.argv.includes('+record-list')) {
  console.log(JSON.stringify({ data: { fields: ['来源内容', '洞察类型'], data: [] } }));
  process.exit(0);
}
const jsonIndex = process.argv.indexOf('--json');
const payload = JSON.parse(process.argv[jsonIndex + 1]);
if (!process.argv.includes('+record-batch-create')) {
  throw new Error('unexpected command');
}
if (!process.argv.includes('tbl_insights')) {
  throw new Error('unexpected table');
}
if (payload.fields[0] !== '洞察标题') {
  throw new Error('unexpected fields');
}
console.log(JSON.stringify({ data: { record_id_list: payload.rows.map((_, index) => 'rec_' + index) } }));
`, 'utf8');
  await chmod(fakeCliPath, 0o755);
  await writeFile(feishuPath, JSON.stringify({
    mode: 'lark-cli',
    bin: fakeCliPath,
    baseAppToken: 'base_xxx',
    tables: {
      creators: minimumTable('tbl_creators'),
      contents: minimumTable('tbl_contents'),
      comments: commentsTable('tbl_comments'),
      insights: {
        tableId: 'tbl_insights',
        fields: {
          title: '洞察标题',
          sourceContentKeys: '来源内容',
          sourceCommentKeys: '来源评论',
          insightType: '洞察类型',
          targetAccounts: '适用账号',
          evidenceSummary: '证据摘要',
          nextAction: '建议动作',
          status: '状态',
        },
      },
    },
  }, null, 2), 'utf8');

  try {
    const result = await writeTopicCandidatesToFeishu({
      feishuPath,
      candidates: [{
        topicTitle: '样例选题',
        serviceDirection: '内容生产系统',
        evidenceSummary: '样例证据',
        nextAction: '人工审核',
        source: {
          contentUniqueKey: 'douyin:dy-001',
        },
      }],
    });

    assert.equal(result.enabled, true);
    assert.equal(result.createdCount, 1);
    assert.deepEqual(result.recordIds, ['rec_0']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('writeTopicCandidatesToFeishu skips duplicate source content insights', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-topic-dedupe-'));
  const fakeCliPath = join(dir, 'fake-lark-cli.mjs');
  const feishuPath = join(dir, 'feishu.json');

  await writeFile(fakeCliPath, `#!/usr/bin/env node
if (process.argv.includes('+record-list')) {
  console.log(JSON.stringify({
    data: {
      fields: ['来源内容', '洞察类型'],
      data: [['douyin:dy-001', '选题']],
      record_id_list: ['rec_existing']
    }
  }));
  process.exit(0);
}
if (process.argv.includes('+record-batch-create')) {
  throw new Error('should not create duplicate records');
}
`, 'utf8');
  await chmod(fakeCliPath, 0o755);
  await writeFile(feishuPath, JSON.stringify({
    mode: 'lark-cli',
    bin: fakeCliPath,
    baseAppToken: 'base_xxx',
    tables: {
      creators: minimumTable('tbl_creators'),
      contents: minimumTable('tbl_contents'),
      comments: commentsTable('tbl_comments'),
      insights: insightTable('tbl_insights'),
    },
  }, null, 2), 'utf8');

  try {
    const result = await writeTopicCandidatesToFeishu({
      feishuPath,
      candidates: [{
        topicTitle: '样例选题',
        serviceDirection: '内容生产系统',
        evidenceSummary: '样例证据',
        nextAction: '人工审核',
        source: {
          contentUniqueKey: 'douyin:dy-001',
        },
      }],
    });

    assert.equal(result.enabled, true);
    assert.equal(result.createdCount, 0);
    assert.equal(result.duplicateCount, 1);
    assert.deepEqual(result.recordIds, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function minimumTable(tableId) {
  return {
    tableId,
    fields: {
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
      uniqueKey: '内容唯一键',
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
    },
  };
}

function insightTable(tableId) {
  return {
    tableId,
    fields: {
      title: '洞察标题',
      sourceContentKeys: '来源内容',
      sourceCommentKeys: '来源评论',
      insightType: '洞察类型',
      targetAccounts: '适用账号',
      evidenceSummary: '证据摘要',
      nextAction: '建议动作',
      status: '状态',
    },
  };
}

function commentsTable(tableId) {
  return {
    tableId,
    fields: {
      commentKey: '评论唯一键',
      contentKey: '内容唯一键',
      commentText: '评论文本',
      commentedAt: '评论时间',
      likeCount: '点赞数',
      userHandle: '用户标识',
      demandType: '需求类型',
      sentiment: '情绪倾向',
      insightStatus: '是否进入洞察',
    },
  };
}
