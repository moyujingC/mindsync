export function buildContentBriefFromInsight(insight, { generatedAt = new Date().toISOString() } = {}) {
  return {
    schema: 'content-matrix/content-brief/v1',
    generatedAt,
    sourceInsightRecordId: insight.recordId,
    title: insight.title,
    targetAccounts: insight.targetAccounts,
    targetAudience: inferTargetAudience(insight),
    userProblem: extractLabeledLine(insight.nextAction, '用户问题') ?? '待人工从来源内容和评论区补充。',
    evidenceSummary: insight.evidenceSummary,
    contentAngle: buildContentAngle(insight),
    suggestedStructure: [
      '用一个真实场景开头，说明问题为什么会出现。',
      '拆解用户现在卡住的环节，避免直接推销服务。',
      '给出一个可执行的小诊断方法或检查清单。',
      '说明什么情况下适合进入 AI 小实验。',
      '用轻量 CTA 邀请对方提供一个样本场景。',
    ],
    cta: extractLabeledLine(insight.nextAction, 'CTA') ?? '如果你也有类似流程或资料，可以拿一个小样本，我先帮你判断适不适合做 AI 小实验。',
    handoffNotes: [
      '进入成稿前必须人工打开来源内容复核。',
      '不要把单条内容直接写成市场结论。',
      '避免承诺确定成交、确定增长或无人监管自动化。',
    ],
  };
}

export function renderContentBriefMarkdown(brief) {
  return [
    `# ${brief.title}`,
    '',
    `> schema：${brief.schema}`,
    `> generated_at：${brief.generatedAt}`,
    `> source_insight_record_id：${brief.sourceInsightRecordId}`,
    '',
    '## 适用账号',
    '',
    listOrFallback(brief.targetAccounts, '待人工判断'),
    '',
    '## 目标读者',
    '',
    brief.targetAudience,
    '',
    '## 用户问题',
    '',
    brief.userProblem,
    '',
    '## 证据摘要',
    '',
    brief.evidenceSummary,
    '',
    '## 内容角度',
    '',
    brief.contentAngle,
    '',
    '## 建议结构',
    '',
    listOrFallback(brief.suggestedStructure, '待人工补充'),
    '',
    '## CTA',
    '',
    brief.cta,
    '',
    '## 交接注意',
    '',
    listOrFallback(brief.handoffNotes, '待人工补充'),
    '',
  ].join('\n');
}

export function buildDraftSeedFromBrief(brief) {
  return {
    schema: 'content-matrix/draft-seed/v1',
    generatedAt: new Date().toISOString(),
    sourceBrief: {
      schema: brief.schema,
      sourceInsightRecordId: brief.sourceInsightRecordId,
      title: brief.title,
    },
    title: brief.title,
    targetAccounts: brief.targetAccounts,
    draftStatus: '待人工扩写',
    opening: `很多人不是不想用 AI，而是不知道该从哪一条真实流程开始。这个问题在「${brief.title}」里可以看到一个入口。`,
    outline: [
      `先描述一个具体卡点：${brief.userProblem}`,
      `再解释为什么这个卡点不能靠“多装一个工具”解决。`,
      `给出一个小检查：输入、处理、输出、人工审核点是否清楚。`,
      `补一句服务指向：如果有真实样本，可以先做一次轻量诊断。`,
    ],
    sourceEvidence: brief.evidenceSummary,
    cta: brief.cta,
    reviewChecklist: [
      '已打开来源内容复核。',
      '没有把单条内容写成市场结论。',
      '没有承诺确定增长、确定成交或无人监管自动化。',
      '已决定发布账号和平台。',
    ],
  };
}

export function renderDraftSeedMarkdown(draftSeed) {
  return [
    `# ${draftSeed.title}`,
    '',
    `> schema：${draftSeed.schema}`,
    `> generated_at：${draftSeed.generatedAt}`,
    `> source_insight_record_id：${draftSeed.sourceBrief.sourceInsightRecordId}`,
    `> status：${draftSeed.draftStatus}`,
    '',
    '## 发布账号候选',
    '',
    listOrFallback(draftSeed.targetAccounts, '待人工判断'),
    '',
    '## 开头草稿',
    '',
    draftSeed.opening,
    '',
    '## 草稿结构',
    '',
    listOrFallback(draftSeed.outline, '待人工补充'),
    '',
    '## 证据来源',
    '',
    draftSeed.sourceEvidence,
    '',
    '## CTA',
    '',
    draftSeed.cta,
    '',
    '## 人工审核清单',
    '',
    listOrFallback(draftSeed.reviewChecklist, '待人工补充'),
    '',
  ].join('\n');
}

function inferTargetAudience(insight) {
  if (insight.targetAccounts.includes('一镜一梳')) {
    return '关注疗愈、整理、日常秩序和自我照顾的女性用户。';
  }
  if (insight.targetAccounts.includes('墨予镜')) {
    return '有真实业务流程、资料整理或内容生产压力的小团队 / 个人专业服务者，以及关注 AI、内容表达和一人公司实践的读者。';
  }
  return '待人工判断。';
}

function buildContentAngle(insight) {
  if (insight.insightType === '选题') {
    return `围绕「${insight.title}」写一篇问题拆解型内容：先讲用户卡点，再给一个小诊断动作。`;
  }
  return `围绕「${insight.title}」提炼一个可验证的内容角度，先保留人工判断。`;
}

function extractLabeledLine(text, label) {
  const line = (text ?? '')
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${label}：`));
  return line?.slice(label.length + 1).trim();
}

function listOrFallback(items, fallback) {
  if (!items?.length) {
    return `- ${fallback}`;
  }
  return items.map((item) => `- ${item}`).join('\n');
}
