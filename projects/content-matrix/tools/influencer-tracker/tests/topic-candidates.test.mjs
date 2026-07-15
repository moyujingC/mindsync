import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTopicCandidate,
  buildTopicCandidatesFromRunReport,
} from '../src/analysis/topic-candidates.mjs';

test('buildTopicCandidatesFromRunReport creates one candidate per new content', () => {
  const candidates = buildTopicCandidatesFromRunReport({
    generatedAt: '2026-07-15T06:00:00.000Z',
    creators: [{
      creatorName: '样例账号',
      platform: 'bilibili',
      newContents: [
        {
          uniqueKey: 'bilibili:BV1',
          title: '内容团队如何用 AI 拆选题和草稿',
          url: 'https://www.bilibili.com/video/BV1',
          publishedAt: '2026-07-15T01:00:00.000Z',
        },
        {
          uniqueKey: 'bilibili:BV2',
          title: '企业 AI 落地为什么先选一条流程',
          url: 'https://www.bilibili.com/video/BV2',
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
      platform: 'bilibili',
    },
    content: {
      uniqueKey: 'bilibili:BV3',
      title: '今天随便聊聊',
      url: 'https://www.bilibili.com/video/BV3',
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
