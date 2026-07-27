import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreContentScreening } from '../src/analysis/content-screening-score.mjs';

test('screening score stays observing when comparable sample is too small', () => {
  const result = scoreContentScreening({ item: item(10, 5, 1), cohort: [item(1, 1, 1)] });
  assert.equal(result.status, '观察中');
  assert.equal(result.topicPotentialScore, null);
});

test('screening score separately recommends topic and L2 content review', () => {
  const cohort = [item(1, 1, 1), item(2, 2, 2), item(3, 3, 3), item(4, 4, 4), item(5, 5, 5)];
  const result = scoreContentScreening({
    item: item(10, 10, 10), cohort, scoredAt: '2026-07-27T00:00:00Z',
  });
  assert.equal(result.status, '可评分');
  assert.equal(result.topicRecommendation, '爆款选题库候选');
  assert.equal(result.substanceRecommendation, '建议申请 L2');
});

test('screening compares interaction per content age instead of raw cumulative totals', () => {
  const scoredAt = '2026-07-27T00:00:00Z';
  const cohort = [
    datedItem(100, 100, 100, '2026-07-26T00:00:00Z'),
    datedItem(200, 200, 200, '2026-07-25T00:00:00Z'),
    datedItem(300, 300, 300, '2026-07-24T00:00:00Z'),
    datedItem(400, 400, 400, '2026-07-23T00:00:00Z'),
    datedItem(500, 500, 500, '2026-07-22T00:00:00Z'),
  ];
  const result = scoreContentScreening({
    item: datedItem(150, 150, 150, '2026-07-26T00:00:00Z'), cohort, scoredAt,
  });
  assert.equal(result.topicPotentialScore, 100);
  assert.equal(result.substanceSignalScore, 100);
});

function item(likeCount, favoriteCount, shareCount) {
  return datedItem(likeCount, favoriteCount, shareCount, '2026-07-26T00:00:00Z');
}

function datedItem(likeCount, favoriteCount, shareCount, publishedAt) {
  return { publishedAt, metrics: { likeCount, favoriteCount, shareCount, commentCount: likeCount } };
}
