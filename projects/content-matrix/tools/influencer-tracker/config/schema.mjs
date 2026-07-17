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
        property: { options: optionNames(['抖音', '小红书', 'B站', 'bilibili']) },
      },
      externalId: { field_name: '平台账号ID', type: FEISHU_FIELD_TYPES.text },
      homepageUrl: { field_name: '主页链接', type: FEISHU_FIELD_TYPES.url },
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
        property: { options: optionNames(['rss', 'rss-file']) },
      },
      sourcePath: { field_name: '数据源地址', type: FEISHU_FIELD_TYPES.text },
      collectAction: {
        field_name: '采集动作',
        type: FEISHU_FIELD_TYPES.singleSelect,
        property: { options: optionNames(['无', '待检查', '待回溯']) },
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
        property: { options: optionNames(['抖音', '小红书', 'B站', 'bilibili']) },
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
        property: { options: optionNames(['墨予镜', '一镜一梳', '知行AI服务']) },
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
};

export function buildFieldNameMap(schema) {
  return Object.fromEntries(
    Object.entries(schema.fields).map(([key, field]) => [key, field.field_name]),
  );
}

function optionNames(names) {
  return names.map((name) => ({ name }));
}
