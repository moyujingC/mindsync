import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runResearchRequest } from '../src/jobs/research-request.mjs';

test('runResearchRequest produces an evidence-backed enterprise AI research brief', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-request-'));
  try {
    const result = await runResearchRequest({
      request: {
        purpose: '评论挖需求',
        serviceDirection: '企业 AI 服务',
        collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note', includeComments: true },
      },
      collect: async () => ({
        request: { mode: 'detail', platform: 'xiaohongshu', includeComments: true, limit: 10 },
        audit: { source: 'tikhub', requestCount: 2, cacheUrls: ['https://cache.example/note'] },
        contents: { fetchedCount: 1, createdCount: 1, duplicateCount: 0, items: [{ uniqueKey: 'xiaohongshu:note-1', platform: 'xiaohongshu', creatorName: 'AI 实践者', contentExternalId: 'note-1', title: '企业 AI 先从一个流程试点', description: '先找到重复、可验收的流程。', url: 'https://example.com/note' }] },
        comments: { fetchedCount: 2, createdCount: 2, duplicateCount: 0, items: [{ commentUniqueKey: 'xiaohongshu:x:1', commentText: '怎么判断先做哪个流程？', demandType: ['问题咨询'], likeCount: 5 }, { commentUniqueKey: 'xiaohongshu:x:2', commentText: '能不能先做低成本试点？', demandType: ['购买意向'], likeCount: 3 }] },
      }),
      outputDir: dir,
    });

    const brief = await readFile(result.outputPath, 'utf8');
    assert.equal(result.status, '待人工确认');
    assert.equal(result.candidates.length, 1);
    assert.match(brief, /研究目的：评论挖需求/);
    assert.match(brief, /服务方向：企业 AI 服务/);
    assert.match(brief, /怎么判断先做哪个流程/);
    assert.match(brief, /人工确认后再进入选题、发布或样本沟通/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('runResearchRequest rejects a request without purpose or service direction', async () => {
  await assert.rejects(
    () => runResearchRequest({ request: { collect: { mode: 'search' } }, collect: async () => ({}) }),
    /requires purpose and serviceDirection/,
  );
});
