const SERVICE_KEYWORDS = [
  ['AI 工作流诊断', ['流程', '工作流', '自动化', 'agent', 'Agent', 'AI']],
  ['AI 文档 / 知识库整理', ['资料', '文档', '知识库', '整理', '沉淀']],
  ['内容生产系统', ['内容', '选题', '草稿', '成稿', '配图', '发布']],
  ['企业 AI 落地 / FDE', ['企业', '团队', '落地', '试点', '协作', '交付']],
];

export function buildTopicCandidatesFromRunReport(runReport) {
  const candidates = [];

  for (const creator of runReport.creators ?? []) {
    for (const content of creator.newContents ?? []) {
      candidates.push(buildTopicCandidate({
        creator,
        content,
        sourceReport: runReport,
      }));
    }
  }

  return candidates;
}

export function buildTopicCandidate({ creator, content, sourceReport }) {
  const text = `${content.title ?? ''} ${content.description ?? ''}`;
  const serviceDirections = inferServiceDirections(text);
  const primaryDirection = serviceDirections[0] ?? '待人工判断';

  return {
    schema: 'content-matrix/topic-candidate/v1',
    candidateId: `${content.uniqueKey}:topic`,
    createdAt: new Date().toISOString(),
    status: '待人工审核',
    source: {
      reportGeneratedAt: sourceReport.generatedAt,
      platform: creator.platform,
      creatorName: creator.creatorName,
      contentUniqueKey: content.uniqueKey,
      contentTitle: content.title,
      contentUrl: content.url,
      publishedAt: content.publishedAt,
    },
    audience: inferAudience(primaryDirection),
    userProblem: inferUserProblem(primaryDirection),
    serviceDirection: primaryDirection,
    secondaryDirections: serviceDirections.slice(1),
    topicTitle: buildTopicTitle(content.title, primaryDirection),
    evidenceSummary: `来源账号「${creator.creatorName}」发布了「${content.title}」。需人工打开原文判断是否存在真实需求信号。`,
    nextAction: '人工查看原内容和评论区，判断是否进入 AI 服务选题池。',
    cta: inferCta(primaryDirection),
  };
}

function inferServiceDirections(text) {
  const normalized = text.toLowerCase();
  return SERVICE_KEYWORDS
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword.toLowerCase())))
    .map(([direction]) => direction);
}

function buildTopicTitle(title, direction) {
  if (direction === '待人工判断') {
    return `观察：${title}`;
  }
  return `从「${title}」看${direction}的真实需求`;
}

function inferAudience(direction) {
  if (direction === '企业 AI 落地 / FDE') {
    return '有真实业务流程和团队协作压力的企业 / 小团队负责人';
  }
  if (direction === 'AI 文档 / 知识库整理') {
    return '资料多、文档散、知识复用差的个人专业服务者或小团队';
  }
  if (direction === '内容生产系统') {
    return '需要稳定产出内容的创作者、咨询顾问、疗愈师或内容团队';
  }
  if (direction === 'AI 工作流诊断') {
    return '有重复流程但不知道 AI 该从哪里介入的人';
  }
  return '待人工判断';
}

function inferUserProblem(direction) {
  if (direction === '企业 AI 落地 / FDE') {
    return '知道要用 AI，但不知道先选哪条流程、如何试点和验收。';
  }
  if (direction === 'AI 文档 / 知识库整理') {
    return '资料分散，无法稳定复用，AI 很难直接帮上忙。';
  }
  if (direction === '内容生产系统') {
    return '内容生产依赖状态，选题、草稿、配图、发布之间断裂。';
  }
  if (direction === 'AI 工作流诊断') {
    return '重复工作很多，但输入、输出和人工审核点没有拆清。';
  }
  return '需要人工从原文和评论中判断具体痛点。';
}

function inferCta(direction) {
  if (direction === '待人工判断') {
    return '如果你也遇到类似问题，可以先留言描述你的具体场景。';
  }
  return '如果你也有类似流程或资料，可以拿一个小样本，我先帮你判断适不适合做 AI 小实验。';
}
