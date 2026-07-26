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
    item: { ...item(10, 10, 10), qualityDiscussionPercentile: 80, completenessPercentile: 80, growthPercentile: 90 },
    cohort, hasMultipleSnapshots: true,
  });
  assert.equal(result.status, '可评分');
  assert.equal(result.topicRecommendation, '爆款选题库候选');
  assert.equal(result.substanceRecommendation, '建议申请 L2');
});

function item(likeCount, favoriteCount, shareCount) {
  return { metrics: { likeCount, favoriteCount, shareCount, commentCount: likeCount } };
}
