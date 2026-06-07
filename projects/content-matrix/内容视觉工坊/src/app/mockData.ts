import type { WorkspaceData } from "./types";

export const workspaceData: WorkspaceData = {
  article: {
    fileName: "AI时代的判断力.md",
    updatedAt: "14:23",
    wordCount: 3284,
    title: "在算法替你思考之前，先把判断力留下来",
  },
  parsedMarkdown: {
    status: "parsed",
    structure: {
      headings: 1,
      subheadings: 6,
      bolds: 14,
      quotes: 3,
      lists: 4,
    },
    structureTags: ["1 标题", "6 小标题", "14 加粗", "3 引用"],
  },
  analysis: {
    cardOutlineTitles: [
      "信息过载时代，判断力比知识更稀缺",
      "AI 给的是答案，编辑要的是问题",
      "三个练习：每天留 20 分钟「不被喂养」的时间",
      "把「我觉得」重新放进文章里",
    ],
    keyQuotes: [
      "提示词不是工作，提问才是。",
      "AI 写得越像范文，越要敢于不工整。",
      "把判断的肌肉，每天养 20 分钟。",
    ],
    coverTheme: {
      title: "判断力 · 在算法之外",
      keywords: "判断力 / 信息筛选 / 提问 / 编辑视角",
    },
  },
  outputToggles: [
    { key: "knowledgeCards", label: "生成知识卡片", hint: "4 张", enabled: true },
    { key: "wechatCover", label: "生成公众号封面", hint: "2.35 : 1", enabled: true },
    { key: "xiaohongshuCover", label: "生成小红书封面", hint: "3 : 4", enabled: true },
  ],
  cardSize: {
    ratio: "3:4",
    width: 1536,
    height: 2048,
    ratioOptions: ["3:4", "4:3", "1:1", "9:16"],
  },
  styleAssets: [
    {
      name: "墨予镜 · 手绘知识卡",
      desc: "纸感底纹 / 手写线条",
      palette: ["#f3ecdb", "#1f3a36", "#b86b3a", "#8a8270"],
      meta: "v2.3 · 用过 18 次",
      pinned: true,
    },
    {
      name: "墨予镜 · 克制留白版",
      desc: "大量留白 / 细衬线标题",
      palette: ["#fbfaf6", "#222222", "#a59f8e", "#d4ccb8"],
      meta: "v1.4 · 用过 9 次",
    },
    {
      name: "墨予镜 · 深色观点版",
      desc: "深底高对比 / 金句视觉化",
      palette: ["#1f2422", "#e9e2cf", "#c9a567", "#3b3f3c"],
      meta: "v1.1 · 用过 6 次",
    },
    {
      name: "内容实验室 · 信息图版",
      desc: "结构化排版 / 数据要点",
      palette: ["#eef2ee", "#15543f", "#3b6fb1", "#c2cec4"],
      meta: "v0.9 · 用过 3 次",
    },
  ],
  activeStyleIndex: 0,
  generation: {
    generatedAt: "14:31",
    cardsCount: 4,
    coversCount: 2,
    layoutStatus: "已生成",
    summaryMeta: [
      { label: "知识卡片", value: "4 张" },
      { label: "封面", value: "2 张" },
      { label: "排版", value: "已生成", emerald: true },
      { label: "生成时间", value: "14:31" },
    ],
  },
  knowledgeCards: [
    {
      n: "01",
      title: "信息过载时代，判断力比知识更稀缺",
      summary: "当所有人都能获取同样的资料，谁能筛掉噪音，谁就掌握了下一层级的话语权。",
      composition: "暖米色纸面 / 手绘箭头 / 主标题居中偏上 / 留白底部 30%",
      img: "https://images.unsplash.com/photo-1686806372785-fcfe9efa9b70?w=900&q=80",
      state: "ok",
    },
    {
      n: "02",
      title: "AI 给的是答案，编辑要的是问题",
      summary: "提示词不是工作，提问才是。创作者的护城河，正在向「问什么」迁移。",
      composition: "深墨绿底 / 米白衬线大字 / 引号装饰 / 右下作者签名印",
      img: "https://images.unsplash.com/photo-1760840415409-bf4b6b14988e?w=900&q=80",
      state: "ok",
    },
    {
      n: "03",
      title: "三个练习：每天留 20 分钟「不被喂养」的时间",
      summary: "不刷推荐流，不看热搜榜，只读一段自己挑的文字 —— 把判断的肌肉养回来。",
      composition: "列表式构图 / 三栏编号 / 衬线小标题 / 卡片底部页脚条",
      img: "",
      state: "failed",
    },
    {
      n: "04",
      title: "把「我觉得」重新放进文章里",
      summary: "AI 写得越像范文，越要敢于不工整。判断力的痕迹，就在那些不够圆润的地方。",
      composition: "纸质纹理 / 手写下划线 / 段落式版面 / 关键词以橙朱标记",
      img: "https://images.unsplash.com/photo-1778664305516-8243da9c2098?w=900&q=80",
      state: "ok",
    },
  ],
  covers: [
    {
      label: "公众号封面",
      ratio: "2.35 : 1",
      status: "已生成 · v2",
      img: "https://images.unsplash.com/photo-1714636608872-048fc9231892?w=1400&q=80",
      wide: true,
    },
    {
      label: "小红书封面",
      ratio: "3 : 4",
      status: "已生成 · v1",
      img: "https://images.unsplash.com/photo-1646600950096-0489e2a461cc?w=900&q=80",
    },
  ],
  draftReview: {
    readyTitle: "可同步到草稿箱",
    readyDescription: "4 项审稿检查全部通过",
    reviewChecks: [
      { title: "Markdown 结构", detail: "6 H2 · 3 引用 · 4 列表", status: "pass" },
      { title: "重点句识别", detail: "3 处金句已强调", status: "pass" },
      { title: "插图位匹配", detail: "4 / 4 完成", status: "pass" },
      { title: "公众号格式", detail: "标题、首图、摘要合规", status: "pass" },
    ],
    syncStatus: [
      { label: "正文排版", note: "Markdown 已转为公众号 HTML · 6 段落" },
      { label: "卡片素材上传", note: "4 张 · 上传至素材库「2026-06」" },
      { label: "封面上传", note: "公众号封面 v2 · 小红书封面 v1" },
      { label: "草稿创建", note: "draft_id: msg_8c91a · 公众号后台可见" },
    ],
  },
};
