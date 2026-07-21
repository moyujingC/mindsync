import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildContentEnrichment, enrichTikHubContent, refineContentText } from '../src/jobs/enrich-content.mjs';

test('refineContentText preserves source wording while removing structural noise', () => {
  assert.equal(
    refineContentText('  企业 AI 先从流程开始。\n\n\n企业 AI 先从流程开始。  \n'),
    '企业 AI 先从流程开始。\n企业 AI 先从流程开始。',
  );
});

test('buildContentEnrichment extracts directions and demand signals', async () => {
  const comments = [{ commentUniqueKey: 'xiaohongshu:xhs-001:comment-1', commentText: '这个流程怎么选？', likeCount: 5, demandType: ['问题咨询'] }, { commentUniqueKey: 'xiaohongshu:xhs-001:comment-2', commentText: '能不能先做一个小试点？', likeCount: 3, demandType: ['问题咨询'] }];

  const analysis = buildContentEnrichment({
    metadata: {
      platform: 'xiaohongshu',
      creatorName: 'AI 实践者',
      contentExternalId: 'xhs-001',
      title: 'AI 服务第一条样例视频',
      description: '这是一条用于本地 dry-run 的样例内容。',
      url: 'https://www.xiaohongshu.com/explore/xhs-001',
    },
    transcript: '后续会接转写、评论和选题链路。',
    comments,
  });

  assert.equal(analysis.schema, 'content-matrix/content-enrichment/v1');
  assert.equal(analysis.primaryDirection, 'AI 工作流诊断');
  assert.ok(analysis.serviceDirections.includes('内容生产系统'));
  assert.deepEqual(analysis.demandSignals[0], { type: '问题咨询', count: 2 });
  assert.match(analysis.userProblems[0], /怎么/);
});

test('enrichTikHubContent writes an enrichment file from standardized content and comments', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-enrich-'));
  const inputPath = join(dir, 'input.json');
  const outputPath = join(dir, 'enrichment.json');

  try {
    await writeFile(inputPath, JSON.stringify({ content: { platform: 'douyin', creatorName: 'AI 顾问', contentExternalId: 'dy-001', title: '企业 AI 先做流程试点', description: '流程和内容需要一起看。', url: 'https://www.douyin.com/video/dy-001' }, comments: [{ commentUniqueKey: 'douyin:dy-001:1', commentText: '怎么开始？', likeCount: 1, demandType: ['问题咨询'] }] }), 'utf8');
    const result = await enrichTikHubContent({ inputPath, outputPath });

    const enrichment = JSON.parse(await readFile(result.outputPath, 'utf8'));

    assert.equal(enrichment.reviewStatus, '待人工审核');
    assert.equal(enrichment.topicCandidates.length, 1);
    assert.equal(enrichment.evidence.refinedText, '企业 AI 先做流程试点\n流程和内容需要一起看。');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
