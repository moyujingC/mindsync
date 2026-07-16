import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildContentEnrichment, enrichContentArtifact } from '../src/jobs/enrich-content.mjs';
import { readJsonFile } from '../src/utils/json-file.mjs';

test('buildContentEnrichment extracts directions and demand signals', async () => {
  const commentsFixture = await readJsonFile(new URL('../fixtures/bilibili-comments.example.json', import.meta.url));
  const comments = commentsFixture.comments.map((comment) => ({
    ...comment,
    commentUniqueKey: `bilibili:bilibili:BV1sample001:${comment.commentId}`,
  }));

  const analysis = buildContentEnrichment({
    metadata: {
      platform: 'bilibili',
      creatorName: 'B站样例账号',
      contentExternalId: 'BV1sample001',
      title: 'AI 服务第一条样例视频',
      description: '这是一条用于本地 dry-run 的样例内容。',
      url: 'https://www.bilibili.com/video/BV1sample001',
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

test('enrichContentArtifact writes enrichment and manifest files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-enrich-'));
  const artifactDir = join(dir, 'artifact');
  const commentsPath = join(dir, 'comments.json');

  try {
    await cp(new URL('../fixtures/bilibili-artifact.example', import.meta.url), artifactDir, {
      recursive: true,
    });
    await cp(new URL('../fixtures/bilibili-comments.example.json', import.meta.url), commentsPath);

    const result = await enrichContentArtifact({
      artifactDir,
      commentsPath,
    });

    const enrichment = JSON.parse(await readFile(result.outputPath, 'utf8'));
    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'));

    assert.equal(enrichment.reviewStatus, '待人工审核');
    assert.equal(enrichment.topicCandidates.length, 1);
    assert.equal(manifest.job, 'enrich');
    assert.equal(manifest.output.insightCount, 1);
    assert.equal(manifest.output.sourceCommentCount, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
