import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildInsightCandidatesFromEnrichment,
  findEnrichmentFiles,
  writeEnrichmentDirectoryInsightsToFeishu,
  writeEnrichmentInsightsToFeishu,
} from '../src/jobs/write-enrichment-insights.mjs';

const enrichment = {
  schema: 'content-matrix/content-enrichment/v1',
  source: {
    platform: 'bilibili',
    creatorName: 'B站样例账号',
    contentExternalId: 'BV1sample001',
    title: 'AI 服务第一条样例视频',
    url: 'https://www.bilibili.com/video/BV1sample001',
  },
  primaryDirection: 'AI 工作流诊断',
  userProblems: ['能不能讲讲评论区需求怎么整理进选题库？'],
  insights: [{
    insightType: '用户需求',
    title: '从样例视频看 AI 工作流诊断的需求信号',
    evidenceSummary: '评论信号：问题咨询 x2',
    nextAction: '人工复核原内容。',
  }],
  topicCandidates: [{
    topicTitle: '从样例视频拆解 AI 工作流诊断的真实需求',
    serviceDirection: 'AI 工作流诊断',
    userProblem: '能不能讲讲评论区需求怎么整理进选题库？',
    evidenceSummary: '评论区出现问题咨询 2 条。',
    nextAction: '先写成问题拆解型内容。',
  }],
  evidence: {
    topComments: [{
      commentUniqueKey: 'bilibili:bilibili:BV1sample001:1002',
      commentText: '能不能讲讲评论区需求怎么整理进选题库？',
    }],
  },
};

test('buildInsightCandidatesFromEnrichment builds user-demand and topic candidates', () => {
  const candidates = buildInsightCandidatesFromEnrichment(enrichment);

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].insightType, '用户需求');
  assert.equal(candidates[0].source.contentUniqueKey, 'bilibili:BV1sample001');
  assert.deepEqual(candidates[0].source.commentUniqueKeys, ['bilibili:bilibili:BV1sample001:1002']);
  assert.equal(candidates[1].insightType, '选题');
  assert.deepEqual(candidates[1].targetAccounts, ['知行AI服务']);
});

test('writeEnrichmentInsightsToFeishu returns candidates when Feishu is disabled', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-enrichment-disabled-'));
  const enrichmentPath = join(dir, 'enrichment.json');

  try {
    await writeFile(enrichmentPath, JSON.stringify(enrichment, null, 2), 'utf8');
    const result = await writeEnrichmentInsightsToFeishu({
      enrichmentPath,
      feishuPath: null,
    });

    assert.equal(result.enabled, false);
    assert.equal(result.inputCount, 2);
    assert.equal(result.createdCount, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('writeEnrichmentInsightsToFeishu writes candidates with lark-cli dedupe', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-enrichment-write-'));
  const enrichmentPath = join(dir, 'enrichment.json');
  const fakeCliPath = join(dir, 'fake-lark-cli.mjs');
  const feishuPath = join(dir, 'feishu.json');

  await writeFile(enrichmentPath, JSON.stringify(enrichment, null, 2), 'utf8');
  await writeFile(fakeCliPath, `#!/usr/bin/env node
if (process.argv.includes('+record-list')) {
  console.log(JSON.stringify({
    data: {
      fields: ['来源内容', '洞察类型'],
      data: [['bilibili:BV1sample001', '用户需求']],
      record_id_list: ['rec_existing']
    }
  }));
  process.exit(0);
}
const jsonIndex = process.argv.indexOf('--json');
const payload = JSON.parse(process.argv[jsonIndex + 1]);
if (!process.argv.includes('+record-batch-create')) {
  throw new Error('unexpected command');
}
console.log(JSON.stringify({ data: { record_id_list: payload.rows.map((_, index) => 'rec_new_' + index) } }));
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
    const result = await writeEnrichmentInsightsToFeishu({
      enrichmentPath,
      feishuPath,
    });

    assert.equal(result.enabled, true);
    assert.equal(result.inputCount, 2);
    assert.equal(result.createdCount, 1);
    assert.equal(result.duplicateCount, 1);
    assert.deepEqual(result.recordIds, ['rec_new_0']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('findEnrichmentFiles scans nested artifact directories', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-enrichment-scan-'));

  try {
    await mkdir(join(dir, 'creator-a', 'content-a'), { recursive: true });
    await mkdir(join(dir, 'creator-b', 'content-b'), { recursive: true });
    await writeFile(join(dir, 'creator-a', 'content-a', 'enrichment.json'), '{}', 'utf8');
    await writeFile(join(dir, 'creator-b', 'content-b', 'other.json'), '{}', 'utf8');

    const files = await findEnrichmentFiles(dir);
    assert.equal(files.length, 1);
    assert.match(files[0], /creator-a\/content-a\/enrichment\.json$/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('writeEnrichmentDirectoryInsightsToFeishu batches candidates from directory', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-enrichment-batch-'));
  const rootDir = join(dir, 'downloads');
  const artifactDir = join(rootDir, 'B站样例账号', 'BV1sample001');
  const fakeCliPath = join(dir, 'fake-lark-cli.mjs');
  const feishuPath = join(dir, 'feishu.json');

  await mkdir(artifactDir, { recursive: true });
  await writeFile(join(artifactDir, 'enrichment.json'), JSON.stringify(enrichment, null, 2), 'utf8');
  await writeFile(fakeCliPath, `#!/usr/bin/env node
if (process.argv.includes('+record-list')) {
  console.log(JSON.stringify({ data: { fields: ['来源内容', '洞察类型'], data: [] } }));
  process.exit(0);
}
const jsonIndex = process.argv.indexOf('--json');
const payload = JSON.parse(process.argv[jsonIndex + 1]);
console.log(JSON.stringify({ data: { record_id_list: payload.rows.map((_, index) => 'rec_batch_' + index) } }));
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
    const result = await writeEnrichmentDirectoryInsightsToFeishu({
      rootDir,
      feishuPath,
    });

    assert.equal(result.enabled, true);
    assert.equal(result.enrichmentCount, 1);
    assert.equal(result.inputCount, 2);
    assert.equal(result.createdCount, 2);
    assert.deepEqual(result.recordIds, ['rec_batch_0', 'rec_batch_1']);
    assert.match(result.candidates[0].source.enrichmentPath, /enrichment\.json$/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('writeEnrichmentDirectoryInsightsToFeishu writes report and marks enrichment files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-enrichment-report-'));
  const rootDir = join(dir, 'downloads');
  const artifactDir = join(rootDir, 'B站样例账号', 'BV1sample001');
  const fakeCliPath = join(dir, 'fake-lark-cli.mjs');
  const feishuPath = join(dir, 'feishu.json');
  const reportPath = join(dir, 'reports', 'enrichment-write.json');
  const enrichmentPath = join(artifactDir, 'enrichment.json');

  await mkdir(artifactDir, { recursive: true });
  await writeFile(enrichmentPath, JSON.stringify(enrichment, null, 2), 'utf8');
  await writeFile(fakeCliPath, `#!/usr/bin/env node
if (process.argv.includes('+record-list')) {
  console.log(JSON.stringify({ data: { fields: ['来源内容', '洞察类型'], data: [] } }));
  process.exit(0);
}
const jsonIndex = process.argv.indexOf('--json');
const payload = JSON.parse(process.argv[jsonIndex + 1]);
console.log(JSON.stringify({ data: { record_id_list: payload.rows.map((_, index) => 'rec_report_' + index) } }));
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
    const result = await writeEnrichmentDirectoryInsightsToFeishu({
      rootDir,
      feishuPath,
      reportPath,
      markProcessed: true,
    });

    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const updatedEnrichment = JSON.parse(await readFile(enrichmentPath, 'utf8'));

    assert.equal(result.reportPath, reportPath);
    assert.equal(report.schema, 'content-matrix/enrichment-write-report/v1');
    assert.equal(report.items[0].status, 'written');
    assert.deepEqual(updatedEnrichment.handoff.recordIds, ['rec_report_0', 'rec_report_1']);
    assert.equal(updatedEnrichment.handoff.createdCount, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('writeEnrichmentDirectoryInsightsToFeishu marks report as disabled without Feishu', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-enrichment-report-disabled-'));
  const rootDir = join(dir, 'downloads');
  const artifactDir = join(rootDir, 'B站样例账号', 'BV1sample001');
  const reportPath = join(dir, 'reports', 'enrichment-write.json');

  await mkdir(artifactDir, { recursive: true });
  await writeFile(join(artifactDir, 'enrichment.json'), JSON.stringify(enrichment, null, 2), 'utf8');

  try {
    const result = await writeEnrichmentDirectoryInsightsToFeishu({
      rootDir,
      feishuPath: null,
      reportPath,
    });

    assert.equal(result.report.feishuEnabled, false);
    assert.equal(result.report.items[0].status, 'disabled');
    assert.equal(result.report.items[0].createdCount, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('writeEnrichmentDirectoryInsightsToFeishu isolates invalid enrichment files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-enrichment-isolate-'));
  const rootDir = join(dir, 'downloads');
  const goodDir = join(rootDir, 'B站样例账号', 'BV1sample001');
  const badDir = join(rootDir, 'B站样例账号', 'bad');
  const fakeCliPath = join(dir, 'fake-lark-cli.mjs');
  const feishuPath = join(dir, 'feishu.json');
  const reportPath = join(dir, 'reports', 'enrichment-write.json');

  await mkdir(goodDir, { recursive: true });
  await mkdir(badDir, { recursive: true });
  await writeFile(join(goodDir, 'enrichment.json'), JSON.stringify(enrichment, null, 2), 'utf8');
  await writeFile(join(badDir, 'enrichment.json'), '{bad json', 'utf8');
  await writeFile(fakeCliPath, `#!/usr/bin/env node
if (process.argv.includes('+record-list')) {
  console.log(JSON.stringify({ data: { fields: ['来源内容', '洞察类型'], data: [] } }));
  process.exit(0);
}
const jsonIndex = process.argv.indexOf('--json');
const payload = JSON.parse(process.argv[jsonIndex + 1]);
console.log(JSON.stringify({ data: { record_id_list: payload.rows.map((_, index) => 'rec_isolated_' + index) } }));
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
    const result = await writeEnrichmentDirectoryInsightsToFeishu({
      rootDir,
      feishuPath,
      reportPath,
    });

    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    assert.equal(result.enrichmentCount, 1);
    assert.equal(result.failedCount, 1);
    assert.equal(result.createdCount, 2);
    assert.equal(report.failedCount, 1);
    assert.equal(report.items.find((item) => item.status === 'failed').candidateCount, 0);
    assert.match(report.items.find((item) => item.status === 'failed').error, /Failed to read JSON file/);
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
