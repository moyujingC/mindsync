export const FEISHU_FIELD_TYPES = {
  text: 1,
  number: 2,
  singleSelect: 3,
  multiSelect: 4,
  date: 5,
  url: 15,
};

export const FEISHU_TABLE_SCHEMAS = {
  creators: {
    tableName: '博主账号',
    defaultViewName: '全部博主',
    fields: {
      name: { field_name: '博主名称', type: FEISHU_FIELD_TYPES.text },
      platform: {
        field_name: '平台',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['抖音', '小红书', '公众号', '视频号', 'douyin', 'xiaohongshu', 'wechat_mp', 'wechat_channels']) },
      },
      externalId: { field_name: '平台账号ID', type: FEISHU_FIELD_TYPES.text },
      homepageUrl: { field_name: '主页链接', type: FEISHU_FIELD_TYPES.url },
      sourceLink: { field_name: '来源链接', type: FEISHU_FIELD_TYPES.url },
      linkType: {
        field_name: '链接类型',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['自动', '博主主页', '单条内容']) },
      },
      enabledStatus: {
        field_name: '启用状态',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['启用', '暂停', '待确认', '失效']) },
      },
      checkFrequency: {
        field_name: '检查频率',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['每日', '每周', '手动']) },
      },
      lastCheckedAt: { field_name: '最近检查时间', type: FEISHU_FIELD_TYPES.date },
      latestContentAt: { field_name: '最近内容时间', type: FEISHU_FIELD_TYPES.date },
      lastStatus: {
        field_name: '最近状态',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['正常', '无更新', '失败', '需人工处理']) },
      },
      failureReason: { field_name: '失败原因', type: FEISHU_FIELD_TYPES.text },
      sourceKind: {
        field_name: '数据源类型',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['TikHub', '手工']) },
      },
      sourcePath: { field_name: '数据源地址', type: FEISHU_FIELD_TYPES.text },
      collectAction: {
        field_name: '采集动作',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['无', '待解析链接', '待检查', '待回溯']) },
      },
      taskStatus: {
        field_name: '任务状态',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['空闲', '执行中', '完成', '失败']) },
      },
      collectSince: { field_name: '采集起始日期', type: FEISHU_FIELD_TYPES.date },
      taskReport: { field_name: '任务报告', type: FEISHU_FIELD_TYPES.text },
      taskLockedAt: { field_name: '任务锁定时间', type: FEISHU_FIELD_TYPES.date },
    },
  },
  contents: {
    tableName: '内容更新',
    defaultViewName: '全部内容',
    fields: {
      uniqueKey: { field_name: '内容唯一键', type: FEISHU_FIELD_TYPES.text },
      platform: {
        field_name: '平台',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['抖音', '小红书', '公众号', '视频号', 'douyin', 'xiaohongshu', 'wechat_mp', 'wechat_channels']) },
      },
      creator: { field_name: '博主', type: FEISHU_FIELD_TYPES.text },
      externalId: { field_name: '内容ID', type: FEISHU_FIELD_TYPES.text },
      url: { field_name: '内容链接', type: FEISHU_FIELD_TYPES.url },
      title: { field_name: '标题', type: FEISHU_FIELD_TYPES.text },
      description: { field_name: '正文/简介', type: FEISHU_FIELD_TYPES.text },
      publishedAt: { field_name: '发布时间', type: FEISHU_FIELD_TYPES.date },
      collectedAt: { field_name: '采集时间', type: FEISHU_FIELD_TYPES.date },
      contentType: {
        field_name: '内容类型',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['图文', '视频', '直播回放', '其他', 'video']) },
      },
      tags: { field_name: '标签', type: FEISHU_FIELD_TYPES.multiSelect },
      likeCount: { field_name: '点赞数', type: FEISHU_FIELD_TYPES.number },
      commentCount: { field_name: '评论数', type: FEISHU_FIELD_TYPES.number },
      favoriteCount: { field_name: '收藏数', type: FEISHU_FIELD_TYPES.number },
      shareCount: { field_name: '转发/分享数', type: FEISHU_FIELD_TYPES.number },
      analysisStatus: {
        field_name: '分析状态',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['待分析', '已分析', '忽略', '需人工复核']) },
      },
      screeningStatus: {
        field_name: '筛选状态',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['待评分', '可评分', '观察中']) },
      },
      topicPotentialScore: { field_name: '爆款选题分', type: FEISHU_FIELD_TYPES.number },
      substanceSignalScore: { field_name: '干货信号分', type: FEISHU_FIELD_TYPES.number },
      topicRecommendation: {
        field_name: '选题建议',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['爆款选题库候选', '人工快速查看', '保留 L1']) },
      },
      substanceRecommendation: {
        field_name: '深读建议',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['建议申请 L2', '保留 L1']) },
      },
      scoredAt: { field_name: '评分时间', type: FEISHU_FIELD_TYPES.date },
      screeningNote: { field_name: '评分说明', type: FEISHU_FIELD_TYPES.text },
    },
  },
  comments: {
    tableName: '评论样本',
    defaultViewName: '全部评论',
    fields: {
      commentKey: { field_name: '评论唯一键', type: FEISHU_FIELD_TYPES.text },
      contentKey: { field_name: '内容唯一键', type: FEISHU_FIELD_TYPES.text },
      commentText: { field_name: '评论文本', type: FEISHU_FIELD_TYPES.text },
      commentedAt: { field_name: '评论时间', type: FEISHU_FIELD_TYPES.date },
      likeCount: { field_name: '点赞数', type: FEISHU_FIELD_TYPES.number },
      userHandle: { field_name: '用户标识', type: FEISHU_FIELD_TYPES.text },
      demandType: {
        field_name: '需求类型',
        type: FEISHU_FIELD_TYPES.multiSelect,
        property: { options: optionNames(['问题咨询', '痛点抱怨', '购买意向', '反对意见', '案例补充']) },
      },
      sentiment: {
        field_name: '情绪倾向',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['正向', '中性', '负向', '未判断']) },
      },
      insightStatus: {
        field_name: '是否进入洞察',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['是', '否', '待定']) },
      },
    },
  },
  engagementSnapshots: {
    tableName: '互动快照',
    defaultViewName: '全部快照',
    fields: {
      snapshotKey: { field_name: '快照唯一键', type: FEISHU_FIELD_TYPES.text },
      contentKey: { field_name: '内容唯一键', type: FEISHU_FIELD_TYPES.text },
      publishedAt: { field_name: '发布时间', type: FEISHU_FIELD_TYPES.date },
      capturedAt: { field_name: '快照时间', type: FEISHU_FIELD_TYPES.date },
      contentAgeDays: { field_name: '内容年龄（天）', type: FEISHU_FIELD_TYPES.number },
      likeCount: { field_name: '点赞数', type: FEISHU_FIELD_TYPES.number },
      commentCount: { field_name: '评论数', type: FEISHU_FIELD_TYPES.number },
      favoriteCount: { field_name: '收藏数', type: FEISHU_FIELD_TYPES.number },
      shareCount: { field_name: '转发/分享数', type: FEISHU_FIELD_TYPES.number },
      runId: { field_name: '采集批次', type: FEISHU_FIELD_TYPES.text },
      source: { field_name: '数据源', type: FEISHU_FIELD_TYPES.text },
    },
  },
  insights: {
    tableName: '洞察与选题',
    defaultViewName: '全部洞察',
    fields: {
      title: { field_name: '洞察标题', type: FEISHU_FIELD_TYPES.text },
      sourceContentKeys: { field_name: '来源内容', type: FEISHU_FIELD_TYPES.text },
      sourceCommentKeys: { field_name: '来源评论', type: FEISHU_FIELD_TYPES.text },
      insightType: {
        field_name: '洞察类型',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['选题', '用户需求', '竞品观察', '表达方式', '产品线索']) },
      },
      targetAccounts: {
        field_name: '适用账号',
        type: FEISHU_FIELD_TYPES.multiSelect,
        property: { options: optionNames(['墨予镜', '一镜一梳']) },
      },
      evidenceSummary: { field_name: '证据摘要', type: FEISHU_FIELD_TYPES.text },
      nextAction: { field_name: '建议动作', type: FEISHU_FIELD_TYPES.text },
      status: {
        field_name: '状态',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['待处理', '已转选题', '已验证', '暂存']) },
      },
    },
  },
  researchRequests: {
    tableName: '研究请求',
    defaultViewName: '全部请求',
    fields: {
      requestId: { field_name: '请求ID', type: FEISHU_FIELD_TYPES.text },
      purpose: { field_name: '研究目的', type: FEISHU_FIELD_TYPES.text },
      serviceDirection: { field_name: '服务方向', type: FEISHU_FIELD_TYPES.text },
      targetAccount: { field_name: '目标账号', type: FEISHU_FIELD_TYPES.text },
      collectMode: {
        field_name: '采集方式',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['详情', '关键词搜索', '账号采样']) },
      },
      platform: {
        field_name: '平台',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['抖音', '小红书', '公众号', '视频号']) },
      },
      sampleLimit: { field_name: '样本上限', type: FEISHU_FIELD_TYPES.number },
      contentCount: { field_name: '内容样本数', type: FEISHU_FIELD_TYPES.number },
      commentCount: { field_name: '评论样本数', type: FEISHU_FIELD_TYPES.number },
      requestCount: { field_name: 'TikHub调用数', type: FEISHU_FIELD_TYPES.number },
      status: {
        field_name: '状态',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['待人工确认', '已转选题', '已发布', '已结束']) },
      },
      nextAction: { field_name: '下一步', type: FEISHU_FIELD_TYPES.text },
      briefPath: { field_name: '研究简报路径', type: FEISHU_FIELD_TYPES.text },
      createdAt: { field_name: '创建时间', type: FEISHU_FIELD_TYPES.date },
      updatedAt: { field_name: '更新时间', type: FEISHU_FIELD_TYPES.date },
    },
  },
  linkInbox: {
    tableName: '链接收件箱',
    defaultViewName: '全部收件',
    fields: {
      inboxId: { field_name: '收件ID', type: FEISHU_FIELD_TYPES.text },
      originalUrl: { field_name: '原始链接', type: FEISHU_FIELD_TYPES.url },
      finalUrl: { field_name: '最终链接', type: FEISHU_FIELD_TYPES.url },
      platform: {
        field_name: '平台',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['抖音', '小红书', '公众号', '视频号']) },
      },
      linkKind: {
        field_name: '链接类型',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['内容', '博主主页', '未识别']) },
      },
      receivedAt: { field_name: '收件时间', type: FEISHU_FIELD_TYPES.date },
      source: { field_name: '来源', type: FEISHU_FIELD_TYPES.text },
      status: {
        field_name: '状态',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['待处理', '处理中', '已完成', '失败', '需人工处理']) },
      },
      result: { field_name: '处理结果', type: FEISHU_FIELD_TYPES.text },
      retryCount: { field_name: '重试次数', type: FEISHU_FIELD_TYPES.number },
      errorSummary: { field_name: '错误摘要', type: FEISHU_FIELD_TYPES.text },
    },
  },
  contentProcessingTasks: {
    tableName: '内容加工任务',
    defaultViewName: '全部任务',
    fields: {
      taskKey: { field_name: '任务唯一键', type: FEISHU_FIELD_TYPES.text },
      contentKey: { field_name: '内容唯一键', type: FEISHU_FIELD_TYPES.text },
      taskType: {
        field_name: '任务类型', type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['L2 内容提纯', '选题洞察']) },
      },
      triggerReason: { field_name: '触发原因', type: FEISHU_FIELD_TYPES.text },
      status: {
        field_name: '状态', type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['待处理', '等待依赖', '执行中', '完成', '失败', '需人工处理']) },
      },
      priority: { field_name: '优先级', type: FEISHU_FIELD_TYPES.number },
      targetAccount: { field_name: '目标账号', type: FEISHU_FIELD_TYPES.text },
      dependencyTaskKey: { field_name: '依赖任务', type: FEISHU_FIELD_TYPES.text },
      artifactPath: { field_name: '产物路径', type: FEISHU_FIELD_TYPES.text },
      errorSummary: { field_name: '错误摘要', type: FEISHU_FIELD_TYPES.text },
      createdAt: { field_name: '创建时间', type: FEISHU_FIELD_TYPES.date },
      updatedAt: { field_name: '更新时间', type: FEISHU_FIELD_TYPES.date },
    },
  },
};

export function buildFieldNameMap(schema) {
  return Object.fromEntries(
    Object.entries(schema.fields).map(([key, field]) => [key, field.field_name]),
  );
}

function optionNames(names) {
  return names.map((name) => ({ name }));
}
