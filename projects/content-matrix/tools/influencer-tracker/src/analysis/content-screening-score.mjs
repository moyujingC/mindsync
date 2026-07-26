// L1 scores rank comparable evidence for human review. They are deliberately
// not claims about content quality, commercial value, or causal performance.
export function scoreContentScreening({ item, cohort, hasMultipleSnapshots = false }) {
  const comparable = cohort.filter((candidate) => candidate?.metrics);
  if (comparable.length < 5) {
    return observing('可比样本不足 5 条');
  }
  const topic = weighted([
    [engagementPercentile(item, comparable, ['likeCount', 'favoriteCount', 'shareCount']), 60],
    [hasMultipleSnapshots ? bounded(item.growthPercentile) : null, 25],
    [metricPercentile(item, comparable, 'commentCount'), 15],
  ]);
  const substanceSignal = weighted([
    [metricPercentile(item, comparable, 'favoriteCount'), 45],
    [metricPercentile(item, comparable, 'shareCount'), 25],
    [bounded(item.qualityDiscussionPercentile), 20],
    [bounded(item.completenessPercentile), 10],
  ]);
  return {
    status: '可评分',
    comparableSampleCount: comparable.length,
    topicPotentialScore: Math.round(topic),
    substanceSignalScore: Math.round(substanceSignal),
    topicRecommendation: topic >= 80 ? '爆款选题库候选' : topic >= 60 ? '人工快速查看' : '保留 L1',
    substanceRecommendation: substanceSignal >= 70 ? '建议申请 L2' : '保留 L1',
  };
}

function engagementPercentile(item, cohort, keys) {
  const available = keys
    .map((key) => metricPercentile(item, cohort, key))
    .filter((score) => score !== null);
  return available.length ? average(available) : null;
}

function metricPercentile(item, cohort, key) {
  const value = item.metrics?.[key];
  const values = cohort.map((candidate) => candidate.metrics?.[key]).filter(Number.isFinite);
  if (!Number.isFinite(value) || values.length < 5) return null;
  return (values.filter((candidate) => candidate <= value).length / values.length) * 100;
}

function weighted(pairs) {
  const present = pairs.filter(([score]) => score !== null && score !== undefined);
  if (present.length === 0) return 0;
  const weightTotal = present.reduce((sum, [, weight]) => sum + weight, 0);
  return present.reduce((sum, [score, weight]) => sum + score * weight, 0) / weightTotal;
}

function bounded(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function observing(reason) {
  return {
    status: '观察中', reason, topicPotentialScore: null, substanceSignalScore: null,
    topicRecommendation: '保留 L1', substanceRecommendation: '保留 L1',
  };
}
