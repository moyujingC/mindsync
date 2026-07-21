import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildTopicCandidate,
  buildTopicCandidatesFromRunReport,
  writeTopicCandidatesReport,
} from '../src/analysis/topic-candidates.mjs';

test('buildTopicCandidatesFromRunReport creates one candidate per new content', () => {
  const candidates = buildTopicCandidatesFromRunReport({
    generatedAt: '2026-07-15T06:00:00.000Z',
    creators: [{
      creatorName: '样例账号',
      platform: 'douyin',
      newContents: [
        {
          uniqueKey: 'douyin:dy-001',
          title: '内容团队如何用 AI 拆选题和草稿',
          url: 'https://www.douyin.com/video/dy-001',
          publishedAt: '2026-07-15T01:00:00.000Z',
        },
        {
          uniqueKey: 'douyin:dy-002',
          title: '企业 AI 落地为什么先选一条流程',
          url: 'https://www.douyin.com/video/dy-002',
          publishedAt: '2026-07-15T02:00:00.000Z',
        },
      ],
    }],
  });

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].status, '待人工审核');
  assert.equal(candidates[0].serviceDirection, 'AI 工作流诊断');
  assert.equal(candidates[1].serviceDirection, 'AI 工作流诊断');
});

test('buildTopicCandidate keeps unclear items for human review', () => {
  const candidate = buildTopicCandidate({
    creator: {
      creatorName: '样例账号',
      platform: 'douyin',
    },
    content: {
      uniqueKey: 'douyin:dy-003',
      title: '今天随便聊聊',
      url: 'https://www.douyin.com/video/dy-003',
      publishedAt: '2026-07-15T03:00:00.000Z',
    },
    sourceReport: {
      generatedAt: '2026-07-15T06:00:00.000Z',
    },
  });

  assert.equal(candidate.serviceDirection, '待人工判断');
  assert.equal(candidate.status, '待人工审核');
  assert.match(candidate.nextAction, /人工查看/);
});

test('writeTopicCandidatesReport writes batch json file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-topic-report-'));
  try {
    const { outputPath } = await writeTopicCandidatesReport({
      report: 'logs/runs/2026-07-15/sample.json',
      candidates: [{
        candidateId: 'candidate-1',
      }],
      outputDir: dir,
    });

    const raw = await readFile(outputPath, 'utf8');
    assert.match(raw, /content-matrix\/topic-candidates-batch\/v1/);
    assert.match(raw, /candidate-1/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
