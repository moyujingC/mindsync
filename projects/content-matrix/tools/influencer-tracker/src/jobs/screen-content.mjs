import { FEISHU_TABLE_SCHEMAS } from '../../config/schema.mjs';
import { scoreContentScreening } from '../analysis/content-screening-score.mjs';
import { mapContentScreeningToFeishuFields, mapFeishuContentRecord } from '../feishu/client.mjs';

const VIEW_DEFINITIONS = [
  {
    name: '爆款选题候选',
    filter: { logic: 'and', conditions: [['选题建议', '==', '爆款选题库候选']] },
    sort: [{ field: '爆款选题分', desc: true }],
    visibleFields: ['标题', '博主', '发布时间', '爆款选题分', '干货信号分', '点赞数', '评论数', '收藏数', '转发/分享数', '选题建议', '评分说明'],
  },
  {
    name: '建议深读（L2）',
    filter: { logic: 'and', conditions: [['深读建议', '==', '建议申请 L2']] },
    sort: [{ field: '干货信号分', desc: true }],
    visibleFields: ['标题', '博主', '发布时间', '干货信号分', '爆款选题分', '收藏数', '转发/分享数', '评论数', '深读建议', '评分说明'],
  },
];

export async function screenFeishuContents({ feishuClient, feishuConfig, dryRun = false, scoredAt = new Date().toISOString() }) {
  const schemaFields = FEISHU_TABLE_SCHEMAS.contents.fields;
  // Existing deployments receive these fields lazily, so do not require a manual
  // config edit before the first screening run.
  const fieldMap = {
    ...feishuConfig.tables.contents.fields,
    ...Object.fromEntries(screeningKeys().map((key) => [key, schemaFields[key].field_name])),
  };
  const createdFields = await ensureScreeningFields({ feishuClient, fieldMap, schemaFields, dryRun });
  const records = await feishuClient.listRecords('contents');
  const contents = records.map((record) => mapFeishuContentRecord(record, fieldMap));
  const cohorts = groupByCreatorAndPlatform(contents);
  const results = [];

  for (const content of contents) {
    const cohort = cohorts.get(cohortKey(content)) ?? [];
    const score = scoreContentScreening({ item: content, cohort, scoredAt });
    const fields = mapContentScreeningToFeishuFields(score, fieldMap, scoredAt);
    if (!dryRun) await feishuClient.updateRecord('contents', content.recordId, fields);
    results.push({ recordId: content.recordId, uniqueKey: content.uniqueKey, creator: content.creatorName, score });
  }

  const views = await ensureScreeningViews({ feishuClient, dryRun });
  return {
    dryRun,
    scoredAt,
    contentCount: contents.length,
    createdFields,
    views,
    scoreableCount: results.filter((result) => result.score.status === '可评分').length,
    observingCount: results.filter((result) => result.score.status === '观察中').length,
    topicCandidateCount: results.filter((result) => result.score.topicRecommendation === '爆款选题库候选').length,
    l2CandidateCount: results.filter((result) => result.score.substanceRecommendation === '建议申请 L2').length,
    results,
  };
}

async function ensureScreeningFields({ feishuClient, fieldMap, schemaFields, dryRun }) {
  const liveFields = await feishuClient.listFields('contents');
  const liveNames = new Set(liveFields.map((field) => field.field_name ?? field.name));
  const created = [];
  for (const key of screeningKeys()) {
    const field = schemaFields[key];
    if (liveNames.has(field.field_name)) continue;
    if (!dryRun) await feishuClient.createField('contents', field);
    created.push(field.field_name);
  }
  return created;
}

async function ensureScreeningViews({ feishuClient, dryRun }) {
  const existing = await feishuClient.listViews('contents');
  const existingNames = new Set(existing.map((view) => view.view_name ?? view.name));
  const results = [];
  for (const definition of VIEW_DEFINITIONS) {
    const exists = existingNames.has(definition.name);
    if (!exists && !dryRun) await feishuClient.createView('contents', { name: definition.name, type: 'grid' });
    if (!dryRun) {
      await feishuClient.setViewFilter('contents', definition.name, definition.filter);
      await feishuClient.setViewSort('contents', definition.name, definition.sort);
      await feishuClient.setViewVisibleFields('contents', definition.name, definition.visibleFields);
    }
    results.push({ name: definition.name, created: !exists });
  }
  return results;
}

function groupByCreatorAndPlatform(contents) {
  const groups = new Map();
  for (const content of contents) {
    const key = cohortKey(content);
    const group = groups.get(key) ?? [];
    group.push(content);
    groups.set(key, group);
  }
  return groups;
}

function cohortKey(content) {
  return `${content.platform || '未知平台'}::${content.creatorName || '未知博主'}`;
}

function screeningKeys() {
  return ['screeningStatus', 'topicPotentialScore', 'substanceSignalScore', 'topicRecommendation', 'substanceRecommendation', 'scoredAt', 'screeningNote'];
}
