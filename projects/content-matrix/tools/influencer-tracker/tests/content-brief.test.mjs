import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildContentBriefFromInsight,
  buildDraftSeedFromBrief,
  renderContentBriefMarkdown,
  renderDraftSeedMarkdown,
} from '../src/analysis/content-brief.mjs';
import { buildBriefsFromFeishu } from '../src/jobs/build-briefs.mjs';

test('buildContentBriefFromInsight creates a handoff-ready brief', () => {
  const brief = buildContentBriefFromInsight({
    recordId: 'rec_1',
    title: '从「AI 服务样例」看 AI 工作流诊断的真实需求',
    insightType: '选题',
    targetAccounts: ['墨予镜'],
    evidenceSummary: '来源账号发布了相关内容。',
    nextAction: '人工查看原内容和评论区。\n用户问题：重复流程多，但不知道从哪里开始。\nCTA：拿一个小样本判断。',
  }, {
    generatedAt: '2026-07-15T12:00:00.000Z',
  });

  assert.equal(brief.sourceInsightRecordId, 'rec_1');
  assert.match(brief.targetAudience, /小团队/);
  assert.equal(brief.userProblem, '重复流程多，但不知道从哪里开始。');
  assert.equal(brief.cta, '拿一个小样本判断。');

  const markdown = renderContentBriefMarkdown(brief);
  assert.match(markdown, /## 目标读者/);
  assert.match(markdown, /## 建议结构/);
  assert.match(markdown, /不要把单条内容直接写成市场结论/);
});

test('buildDraftSeedFromBrief creates a draft handoff seed', () => {
  const brief = buildContentBriefFromInsight({
    recordId: 'rec_1',
    title: '从「AI 服务样例」看 AI 工作流诊断的真实需求',
    insightType: '选题',
    targetAccounts: ['墨予镜'],
    evidenceSummary: '来源账号发布了相关内容。',
    nextAction: '人工查看原内容和评论区。\n用户问题：重复流程多，但不知道从哪里开始。\nCTA：拿一个小样本判断。',
  });
  const draftSeed = buildDraftSeedFromBrief(brief);
  const markdown = renderDraftSeedMarkdown(draftSeed);

  assert.equal(draftSeed.draftStatus, '待人工扩写');
  assert.match(draftSeed.opening, /不知道该从哪一条真实流程开始/);
  assert.match(markdown, /## 草稿结构/);
  assert.match(markdown, /已打开来源内容复核/);
});

test('buildBriefsFromFeishu writes briefs for approved insights only', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-briefs-'));
  const fakeCliPath = join(dir, 'fake-lark-cli.mjs');
  const feishuPath = join(dir, 'feishu.json');
  const outputDir = join(dir, 'briefs');

  await writeFile(fakeCliPath, `#!/usr/bin/env node
if (!process.argv.includes('+record-list')) {
  throw new Error('unexpected command');
}
console.log(JSON.stringify({
  data: {
    fields: ['洞察标题', '来源内容', '来源评论', '洞察类型', '适用账号', '证据摘要', '建议动作', '状态'],
    data: [
      [
        '已审核选题',
        'douyin:dy-001',
        '',
        '选题',
        ['墨予镜'],
        '样例证据',
        '人工查看原内容。\\n用户问题：资料散，难复用。\\nCTA：拿一个小样本判断。',
        '已转选题'
      ],
      [
        '未审核选题',
        'douyin:dy-002',
        '',
        '选题',
        ['墨予镜'],
        '样例证据',
        '人工查看原内容。',
        '待处理'
      ]
    ],
    record_id_list: ['rec_ready', 'rec_pending']
  }
}));
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
    const result = await buildBriefsFromFeishu({
      feishuPath,
      outputDir,
    });

    assert.equal(result.selectedCount, 1);
    assert.equal(result.createdCount, 1);
    assert.equal(result.outputs[0].recordId, 'rec_ready');

    const markdown = await readFile(result.outputs[0].filePath, 'utf8');
    assert.match(markdown, /# 已审核选题/);
    assert.match(markdown, /资料散，难复用/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('buildBriefsFromFeishu can create draft seeds and mark insight status', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-drafts-'));
  const fakeCliPath = join(dir, 'fake-lark-cli.mjs');
  const feishuPath = join(dir, 'feishu.json');
  const outputDir = join(dir, 'briefs');
  const draftDir = join(dir, 'drafts');
  const updatesPath = join(dir, 'updates.jsonl');

  await writeFile(fakeCliPath, `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
if (process.argv.includes('+record-list')) {
  console.log(JSON.stringify({
    data: {
      fields: ['洞察标题', '来源内容', '来源评论', '洞察类型', '适用账号', '证据摘要', '建议动作', '状态'],
      data: [[
        '已审核选题',
        'douyin:dy-001',
        '',
        '选题',
        ['墨予镜'],
        '样例证据',
        '人工查看原内容。\\\\n用户问题：资料散，难复用。\\\\nCTA：拿一个小样本判断。',
        '已转选题'
      ]],
      record_id_list: ['rec_ready']
    }
  }));
  process.exit(0);
}
if (process.argv.includes('+record-batch-update')) {
  const jsonIndex = process.argv.indexOf('--json');
  appendFileSync('${updatesPath}', process.argv[jsonIndex + 1] + '\\n');
  console.log(JSON.stringify({ data: { ok: true } }));
  process.exit(0);
}
throw new Error('unexpected command');
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
    const result = await buildBriefsFromFeishu({
      feishuPath,
      outputDir,
      draftDir,
      markStatus: '已验证',
    });

    assert.equal(result.createdCount, 1);
    assert.equal(result.outputs[0].markedStatus, '已验证');
    assert.ok(result.outputs[0].draftPath);

    const draftMarkdown = await readFile(result.outputs[0].draftPath, 'utf8');
    assert.match(draftMarkdown, /## 开头草稿/);

    const updatePayload = JSON.parse(await readFile(updatesPath, 'utf8'));
    assert.deepEqual(updatePayload.record_id_list, ['rec_ready']);
    assert.deepEqual(updatePayload.patch, { 状态: '已验证' });
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
