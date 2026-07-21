const TEMPLATES = {
  enterprise_ai_service: {
    id: 'enterprise_ai_service',
    name: '企业 AI 服务市场调研',
    purpose: '评论挖需求',
    serviceDirection: '企业 AI 服务',
    targetAccount: '墨予镜',
    sampleLimit: 10,
    includeComments: true,
    outputFocus: '服务假设',
    constraints: [
      '将评论和内容视为市场线索，不直接当作成交证据。',
      '候选内容只能进入人工审核，不自动报价、私信或发布。',
    ],
  },
  moyujing: {
    id: 'moyujing',
    name: '墨予镜内容研究',
    purpose: '选题调研',
    serviceDirection: '墨予镜',
    targetAccount: '墨予镜',
    sampleLimit: 5,
    includeComments: false,
    outputFocus: '内容角度',
    followUpWorkflow: '媒体提纯',
    constraints: [
      '保留原文来源和表达证据，不把单一内容写成行业结论。',
      '转成草稿前仍需人工判断是否符合账号定位与写作规则。',
    ],
  },
  yijing_yishu: {
    id: 'yijing_yishu',
    name: '一镜一梳内容研究',
    purpose: '选题调研',
    serviceDirection: '一镜一梳',
    targetAccount: '一镜一梳',
    sampleLimit: 5,
    includeComments: false,
    outputFocus: '匿名内容观察',
    followUpWorkflow: '媒体提纯',
    constraints: [
      '仅整理公开表达，不记录或推断可识别个人信息。',
      '不输出心理诊断、疗效判断或替代专业服务的建议。',
    ],
  },
  client_project: {
    id: 'client_project',
    name: '客户项目调研',
    purpose: '市场需求调研',
    serviceDirection: '客户项目',
    sampleLimit: 10,
    includeComments: true,
    outputFocus: '客户专属样本包与问题清单',
    constraints: [
      '客户项目名称只作为内部代号，不写入公开内容或外部样本。',
      '不上传客户非公开资料；仅使用获授权的公开内容和脱敏聚合结论。',
      '研究结论需由项目负责人确认后才能进入客户交付。',
    ],
  },
};

export function listResearchTemplates() {
  return Object.values(TEMPLATES).map(({ id, name, purpose, serviceDirection, targetAccount, sampleLimit, includeComments, outputFocus, followUpWorkflow }) => ({
    id,
    name,
    purpose,
    serviceDirection,
    targetAccount: targetAccount ?? null,
    sampleLimit,
    includeComments,
    outputFocus,
    followUpWorkflow: followUpWorkflow ?? null,
  }));
}

export function applyResearchTemplate({ templateId, request, projectName = null }) {
  if (!templateId) {
    return request;
  }
  const template = TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown research template: ${templateId}. Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
  }
  if (templateId === 'client_project' && !projectName?.trim()) {
    throw new Error('client_project template requires projectName');
  }

  return {
    ...request,
    purpose: request.purpose ?? template.purpose,
    serviceDirection: request.serviceDirection ?? template.serviceDirection,
    targetAccount: request.targetAccount ?? (templateId === 'client_project' ? projectName.trim() : template.targetAccount),
    collect: {
      ...request.collect,
      limit: request.collect?.limit ?? template.sampleLimit,
      includeComments: request.collect?.includeComments ?? template.includeComments,
    },
    orchestration: {
      templateId: template.id,
      templateName: template.name,
      projectName: templateId === 'client_project' ? projectName.trim() : null,
      outputFocus: template.outputFocus,
      followUpWorkflow: template.followUpWorkflow ?? null,
      constraints: template.constraints,
    },
  };
}
