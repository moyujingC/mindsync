// L1 scores rank comparable evidence for human review. They are deliberately
// not claims about content quality, commercial value, or causal performance.
export function scoreContentScreening({ item, cohort, scoredAt = new Date() }) {
  const comparable = cohort.filter((candidate) => candidate?.metrics);
  if (comparable.length < 5) {
    return observing('可比样本不足 5 条');
  }
  const topic = weighted([
    [dailyEngagementPercentile(item, comparable, ['likeCount', 'favoriteCount', 'shareCount'], scoredAt), 80],
    [dailyMetricPercentile(item, comparable, 'commentCount', scoredAt), 20],
  ]);
  const substanceSignal = weighted([
    [dailyMetricPercentile(item, comparable, 'favoriteCount', scoredAt), 55],
    [dailyMetricPercentile(item, comparable, 'shareCount', scoredAt), 30],
    [dailyMetricPercentile(item, comparable, 'commentCount', scoredAt), 15],
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

function dailyEngagementPercentile(item, cohort, keys, scoredAt) {
  const available = keys
    .map((key) => dailyMetricPercentile(item, cohort, key, scoredAt))
    .filter((score) => score !== null);
  return available.length ? average(available) : null;
}

function dailyMetricPercentile(item, cohort, key, scoredAt) {
  const value = perDayMetric(item, key, scoredAt);
  const values = cohort.map((candidate) => perDayMetric(candidate, key, scoredAt)).filter(Number.isFinite);
  if (!Number.isFinite(value) || values.length < 5) return null;
  return (values.filter((candidate) => candidate <= value).length / values.length) * 100;
}

function perDayMetric(item, key, scoredAt) {
  const value = item.metrics?.[key];
  if (!Number.isFinite(value)) return null;
  const publishedAt = new Date(item.publishedAt).getTime();
  const scoredAtMs = new Date(scoredAt).getTime();
  // A post has at least one observation day so a same-day item does not divide by zero.
  const ageDays = Number.isFinite(publishedAt) && Number.isFinite(scoredAtMs)
    ? Math.max(1, (scoredAtMs - publishedAt) / 86_400_000)
    : 1;
  return value / ageDays;
}

function weighted(pairs) {
  const present = pairs.filter(([score]) => score !== null && score !== undefined);
  if (present.length === 0) return 0;
  const weightTotal = present.reduce((sum, [, weight]) => sum + weight, 0);
  return present.reduce((sum, [score, weight]) => sum + score * weight, 0) / weightTotal;
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
