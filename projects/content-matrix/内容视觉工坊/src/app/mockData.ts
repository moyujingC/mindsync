import type { WorkspaceData } from "./types";
import { buildDraftReview } from "./lib/layoutGeneration";

const baseWorkspaceData = {
  article: {
    fileName: "AI 最磨人的陷阱：拉高了能力，透支了人生.md",
    updatedAt: "14:23",
    wordCount: 3412,
    title: "AI 最磨人的陷阱：拉高了能力，透支了人生",
    rawText: `这段时间，我一直在复盘自己长期重度使用AI的真实状态。

有一个愈发清晰的切身感受：

我从前一直以为，AI会让我的工作和生活变得更轻松。

可真正高频、沉浸式用下来才发现，我最先收获的不是高效与松弛，而是一种**隐秘极强、慢慢磨人的精神疲惫**。

现在我终于彻底读懂了这句话：**深度用上AI后，人才真正懂什么叫活儿永远干不完**。

这种无休止的忙碌，不是因为我变得更勤奋，也不是我主动内卷内耗。

所有疲惫的根源，只有核心一句：**AI拉高了所有事情的可行性，却没有同步提升人的精力承载力**。

## 以前很多事，不是不想做，是推进成本太高

从前的我，从来不缺想法，尤其是在内容创作这件事上。

有独特观点、有完整框架、有满满的表达欲，但绝大多数想法，最终都死死卡在提纲阶段，再也无法向前推进。

因为一篇优质的内容，从来不是只有观点就足够的。

只是**推进成本过高，高到让人被动止步、自动筛选、理性放弃**。

## AI打破了成本壁垒，也打开了无限的可能性

而AI的出现，直接推翻了这套天然的自我减负机制。

想不通的难题，可以无限次深度探讨；单薄零散的想法，可以一步步拆解细化；简陋粗糙的提纲，可以多角度推演、丰满成型。

很多人觉得AI只是提速了工作效率，但在我看来，它带来的改变远比这更深刻：**它让我们看见了无数从前被高成本掩盖的人生可能性。**

## 可推进的事越多，需要做的判断就越累

从前做事，天然有终点、有边界。

但进入AI时代，大部分工作都没有了天然终点。

每一个深挖的方向，看起来都合理、都有价值、都值得深耕。可一旦不懂收口、不懂止损，所有“可推进”的机会，最终都会变成无休止的精力消耗。

最后酿成最讽刺的局面：**本该解放人力、减负增效的AI，反而让我们工作时长更长、决策更多、内心更累。**

## 真正的疲惫，从来不是执行，是判断与收口

长期复盘后我彻底明白：AI带来的疲惫，从来都不是身体上的劳累。

真正消耗人的，是**持续筛选、反复判断、不断取舍、强行收口的深度精神内耗**。

**AI可以无休无止继续推进，但人无法时时刻刻持续判断。**

## 做内容的执念，最容易放大这份疲惫

这种隐形内耗，在内容创作者身上体现得最为淋漓尽致。

但可怕的是，一旦陷入这套完美逻辑，一篇轻松的个人随笔，瞬间就会升级为一项繁重的研究项目。

慢慢的，我想通了一个很重要的道理：

**有些文章的价值，不在于完美论证一个道理，而在于把一种人人都有、却无人说透的体验讲清楚。**

## 不是少用AI，而是给自己设边界

彻底想通透后，我完全调整了自己的AI使用逻辑。

但我不再一上来就追问：还能再优化吗？还能再深挖吗？还能再完善得更好吗？

取而代之的，是先问自己几个更核心、更关键的问题：

这件事，当下真的值得做吗？

做到什么程度，就足够够用了？

AI拓宽了我们的能力边界，我们必须守住自己的精力边界。`,
  },
  parsedMarkdown: {
    status: "parsed",
    structure: {
      headings: 0,
      subheadings: 6,
      bolds: 13,
      quotes: 0,
      lists: 0,
    },
    structureTags: ["0 标题", "6 小标题", "13 加粗", "0 引用"],
  },
  analysis: {
    imageGenerationSource: {
      contentKind: "full-article-text",
      strategy: "直接将全文交给大模型，由模型自动拆成 6 张知识卡片并生成每张图的视觉方案",
    },
    cardOutlineTitles: [
      "以前很多事，不是不想做，是推进成本太高",
      "AI打破了成本壁垒，也打开了无限的可能性",
      "可推进的事越多，需要做的判断就越累",
      "真正的疲惫，从来不是执行，是判断与收口",
      "做内容的执念，最容易放大这份疲惫",
      "不是少用AI，而是给自己设边界",
    ],
    keyQuotes: [
      "隐秘极强、慢慢磨人的精神疲惫",
      "深度用上AI后，人才真正懂什么叫活儿永远干不完",
      "AI拉高了所有事情的可行性，却没有同步提升人的精力承载力",
    ],
    coverTheme: {
      title: "AI 拉高能力，也透支人生",
      keywords: "精神疲惫 / 精力边界 / 收口判断 / AI 时代主体性",
    },
  },
  cardPlan: [
    {
      index: 1,
      title: "以前很多事，不是不想做，是推进成本太高",
      summary: "很多有价值的事，从前之所以没继续，不是因为不重要，而是推进成本太高，高到让人理性放弃。",
    },
    {
      index: 2,
      title: "AI打破了成本壁垒，也打开了无限的可能性",
      summary: "AI 让许多原本推进不了的想法突然变得可落地，也因此放大了人生中所有值得深挖的可能性。",
    },
    {
      index: 3,
      title: "可推进的事越多，需要做的判断就越累",
      summary: "问题不再是能不能做，而是所有方向都能做，最后最耗人的变成了无穷无尽的判断与取舍。",
    },
    {
      index: 4,
      title: "真正的疲惫，从来不是执行，是判断与收口",
      summary: "AI 不会累，但人会。真正消耗人的不是执行动作，而是反复筛选、比对、决策与强行收口。",
    },
    {
      index: 5,
      title: "做内容的执念，最容易放大这份疲惫",
      summary: "内容创作者最容易把一篇随笔升级成研究项目，最后不是表达更好了，而是被完美主义拖住了。",
    },
    {
      index: 6,
      title: "不是少用AI，而是给自己设边界",
      summary: "不是戒掉 AI，而是学会先判断这件事值不值得做、做到什么程度够用，以及哪些方向该主动放弃。",
    },
  ],
  workflowStages: [
    { key: "upload", label: "原稿上传", status: "success", detail: "Markdown 文件已读取" },
    { key: "markdownParse", label: "Markdown 解析", status: "success", detail: "标题、引用、列表等结构已识别" },
    { key: "contentAnalysis", label: "内容拆解", status: "success", detail: "已拆为 6 张卡片，并提炼金句与封面主题" },
    { key: "imageGeneration", label: "图片生成", status: "failed", detail: "6 张卡片与正文配图中仍有素材待生成，可局部重试", retryable: true },
    { key: "layoutGeneration", label: "排版生成", status: "success", detail: "公众号正文预览已生成，并完成插图位编排" },
    { key: "draftSync", label: "草稿同步", status: "success", detail: "公众号草稿已创建，可继续重新同步或打开草稿" },
  ],
  outputToggles: [
    { key: "knowledgeCards", label: "生成知识卡片", hint: "6 张", enabled: true },
    { key: "wechatCover", label: "生成公众号封面", hint: "2.35 : 1", enabled: true },
    { key: "wechatShareCover", label: "生成公众号转发封面", hint: "1 : 1", enabled: true },
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
      accountName: "墨予镜",
      family: "主风格",
      name: "墨予镜 · 纸本人文科技",
      desc: "纸感底纹 / 人文科技 / 结构化信息",
      palette: ["#f3ecdb", "#1f3a36", "#b86b3a", "#8a8270"],
      meta: "主风格 A01 · 参考图 12 张",
      fit: ["knowledgeCards", "wechatCover", "wechatShareCover", "xiaohongshuCover"],
      mood: ["纸本", "人文科技", "安静结构", "信息感"],
      promptBase: "纸本人文科技气质，低饱和纸张底色，克制留白，结构清楚，信息层级明确，避免强赛博和高噪点特效。",
      referenceImages: ["IMG_7772.JPG", "IMG_7773.JPG", "IMG_7774.JPG", "IMG_7775.JPG", "IMG_7776.JPG", "IMG_7777.JPG", "IMG_7802.JPG", "IMG_7803.JPG", "IMG_7804.JPG", "IMG_7806.JPG", "IMG_7835.JPG", "IMG_7867.JPG"],
      pinned: true,
    },
    {
      accountName: "墨予镜",
      family: "主风格",
      name: "墨予镜 · 留白专栏系",
      desc: "大量留白 / 细字层级 / 安静专栏感",
      palette: ["#fbfaf6", "#222222", "#a59f8e", "#d4ccb8"],
      meta: "主风格 A02 · 参考图 10 张",
      fit: ["wechatInlineImages", "wechatCover", "wechatShareCover", "knowledgeCards"],
      mood: ["留白", "专栏", "克制", "观察感"],
      promptBase: "留白充足，编辑部专栏气质，文字很少或不出现大段文字，画面轻，安静，适合作为公众号正文配图或观点封面。",
      referenceImages: ["IMG_7784.JPG", "IMG_7785.JPG", "IMG_7786.JPG", "IMG_7787.JPG", "IMG_7788.JPG", "IMG_7789.JPG", "IMG_7790.JPG", "IMG_7791.JPG", "IMG_7863.JPG", "IMG_7873.JPG"],
      pinned: true,
    },
    {
      accountName: "墨予镜",
      family: "辅风格",
      name: "墨予镜 · 轻手账说明系",
      desc: "手写边注 / 纸张拼贴 / 说明感更强",
      palette: ["#efe3c8", "#5e584c", "#b57c4d", "#d6c2a3"],
      meta: "辅风格 B01 · 参考图 16 张",
      fit: ["knowledgeCards", "xiaohongshuCover"],
      mood: ["手账", "说明", "亲近", "收藏感"],
      promptBase: "轻手账和纸张拼贴风格，手写注释感，信息表达清楚但不拥挤，适合知识卡片与小红书封面，不适合做重信息的公众号正文插图。",
      referenceImages: ["IMG_7792.JPG", "IMG_7795.JPG", "IMG_7796.JPG", "IMG_7797.JPG", "IMG_7798.JPG", "IMG_7799.JPG", "IMG_7800.JPG", "IMG_7801.JPG", "IMG_7807.JPG", "IMG_7808.JPG", "IMG_7809.JPG", "IMG_7810.JPG", "IMG_7811.JPG", "IMG_7812.JPG", "IMG_7813.JPG", "IMG_7814.JPG"],
    },
    {
      accountName: "墨予镜",
      family: "辅风格",
      name: "墨予镜 · 认知科技蓝调",
      desc: "浅蓝灰科技感 / 认知主题 / 编辑型未来感",
      palette: ["#edf2f7", "#5d7185", "#9db3ca", "#d7dde5"],
      meta: "辅风格 B02 · 参考图 14 张",
      fit: ["knowledgeCards", "wechatCover", "wechatShareCover", "wechatInlineImages", "xiaohongshuCover"],
      mood: ["认知科技", "蓝灰", "未来感", "编辑图像"],
      promptBase: "认知科技型视觉，蓝灰与米白为主，轻未来感，避免高饱和赛博霓虹，适合 AI 主题文章封面和正文配图。",
      referenceImages: ["IMG_7827.JPG", "IMG_7828.JPG", "IMG_7829.JPG", "IMG_7830.JPG", "IMG_7831.JPG", "IMG_7832.JPG", "IMG_7833.JPG", "IMG_7834.JPG", "IMG_7836.JPG", "IMG_7837.JPG", "IMG_7838.JPG", "IMG_7839.JPG", "IMG_7868.JPG", "IMG_7869.JPG"],
    },
    {
      accountName: "墨予镜",
      family: "辅风格",
      name: "墨予镜 · 杂志观察系",
      desc: "人物观察 / 轻电影感 / 安静叙述",
      palette: ["#f3f0e8", "#4f4b46", "#98a4b0", "#d8d2c6"],
      meta: "辅风格 B03 · 参考图 11 张",
      fit: ["wechatInlineImages", "wechatCover", "wechatShareCover", "xiaohongshuCover"],
      mood: ["观察", "叙述", "杂志", "轻电影感"],
      promptBase: "像杂志内页或文化专栏插图，人物与空间关系安静，有观察视角，不做大段文字堆叠，适合公众号正文配图与封面。",
      referenceImages: ["IMG_7856.JPG", "IMG_7857.JPG", "IMG_7858.JPG", "IMG_7859.JPG", "IMG_7860.JPG", "IMG_7861.JPG", "IMG_7862.JPG", "IMG_7864.JPG", "IMG_7865.JPG", "IMG_7866.JPG", "IMG_1955953439.JPG"],
    },
    {
      accountName: "墨予镜",
      family: "实验风格",
      name: "墨予镜 · 纸面方法论卡",
      desc: "步骤清单 / 模块拼贴 / 方法感更强",
      palette: ["#f5ebd7", "#6c6557", "#cfa968", "#dbd2c2"],
      meta: "实验风格 C01 · 参考图 16 张",
      fit: ["knowledgeCards", "xiaohongshuCover"],
      mood: ["方法", "清单", "纸面结构", "高信息密度"],
      promptBase: "纸面方法论图卡，模块与步骤清晰，适合收藏型知识卡片，信息密度可以偏高，但仍保持纸感和秩序。",
      referenceImages: ["IMG_7815.JPG", "IMG_7816.JPG", "IMG_7817.JPG", "IMG_7818.JPG", "IMG_7819.JPG", "IMG_7820.JPG", "IMG_7821.JPG", "IMG_7822.JPG", "IMG_7823.JPG", "IMG_7824.JPG", "IMG_7825.JPG", "IMG_7826.JPG", "IMG_7870.JPG", "IMG_7871.JPG", "IMG_7872.JPG", "IMG_-641146956.JPG"],
    },
  ],
  layoutThemes: [
    {
      accountName: "墨予镜",
      name: "墨予镜 · 留白长文版",
      desc: "白底长文 / 细衬线标题 / 克制强调",
      meta: "公众号主题 · A01",
      previewPalette: ["#f4f0e8", "#ffffff", "#2a2a2a", "#b7aa92"],
      shellBg: "#f4f0e8",
      articleBg: "#ffffff",
      titleColor: "#1f1f1f",
      headingColor: "#2a2a2a",
      bodyColor: "#3d3d3d",
      mutedColor: "#8d816f",
      quoteBg: "#f7f2e9",
      quoteBorder: "#a58352",
      ctaBg: "#2a2a2a",
      ctaText: "#ffffff",
      figureBg: "#efe7da",
      placeholderBg: "#faf6ef",
      placeholderBorder: "#d7ccb7",
      headingFontSize: 22,
      paragraphSpacing: 18,
      sectionSpacing: 28,
      imageRadius: 8,
      quoteRadius: 10,
      quoteBorderWidth: 4,
      ctaRadius: 999,
      captionAlign: "center",
      ctaTitle: "如果这段文字让你停了一下，欢迎留言告诉我",
      ctaButtonText: "点亮「在看」 · 分享给同样在思考的人",
      coverBottomSpacing: 20,
      inlineImageSpacing: 28,
      quoteSpacing: 18,
      pinned: true,
    },
    {
      accountName: "内容实验室",
      name: "内容实验室 · 结构阅读版",
      desc: "冷静信息感 / 分节更清楚 / 适合方法文",
      meta: "公众号主题 · B02",
      previewPalette: ["#edf3f0", "#ffffff", "#1c5143", "#9eb5ad"],
      shellBg: "#edf3f0",
      articleBg: "#ffffff",
      titleColor: "#173f35",
      headingColor: "#1c5143",
      bodyColor: "#30413c",
      mutedColor: "#71867f",
      quoteBg: "#f1f7f4",
      quoteBorder: "#1c5143",
      ctaBg: "#1c5143",
      ctaText: "#ffffff",
      figureBg: "#e4efe9",
      placeholderBg: "#f7fbf9",
      placeholderBorder: "#bdd0c9",
      headingFontSize: 20,
      paragraphSpacing: 16,
      sectionSpacing: 24,
      imageRadius: 6,
      quoteRadius: 8,
      quoteBorderWidth: 3,
      ctaRadius: 14,
      captionAlign: "left",
      ctaTitle: "如果这篇方法文对你有帮助，欢迎收藏备用",
      ctaButtonText: "转发给正在整理方法的人",
      coverBottomSpacing: 18,
      inlineImageSpacing: 24,
      quoteSpacing: 14,
    },
    {
      accountName: "墨予镜",
      name: "墨予镜 · 深墨专栏版",
      desc: "低饱和深墨 / 更强专栏感 / 适合观点文",
      meta: "公众号主题 · C01",
      previewPalette: ["#ece6df", "#fffdf9", "#2f332f", "#a59684"],
      shellBg: "#ece6df",
      articleBg: "#fffdf9",
      titleColor: "#252825",
      headingColor: "#2f332f",
      bodyColor: "#3c403c",
      mutedColor: "#867a6d",
      quoteBg: "#f4efe8",
      quoteBorder: "#2f332f",
      ctaBg: "#2f332f",
      ctaText: "#ffffff",
      figureBg: "#e8ded2",
      placeholderBg: "#f8f3ec",
      placeholderBorder: "#d2c5b6",
      headingFontSize: 23,
      paragraphSpacing: 20,
      sectionSpacing: 30,
      imageRadius: 10,
      quoteRadius: 12,
      quoteBorderWidth: 4,
      ctaRadius: 999,
      captionAlign: "center",
      ctaTitle: "如果你也在想这个问题，欢迎把你的判断写在留言区",
      ctaButtonText: "点亮「在看」 · 留下你的观点",
      coverBottomSpacing: 22,
      inlineImageSpacing: 30,
      quoteSpacing: 20,
    },
  ],
  styleSelections: {
    knowledgeCards: 0,
    wechatInlineImages: 1,
    wechatLayout: 0,
    wechatCover: 2,
    wechatShareCover: 1,
    xiaohongshuCover: 0,
  },
  generation: {
    generatedAt: "14:31",
    cardsCount: 6,
    coversCount: 3,
    layoutStatus: "已生成",
    summaryMeta: [
      { label: "知识卡片", value: "6 张" },
      { label: "封面", value: "3 张" },
      { label: "排版", value: "已生成", emerald: true },
      { label: "生成时间", value: "14:31" },
    ],
  },
  knowledgeCards: [
    {
      n: "01",
      title: "以前很多事，不是不想做，是推进成本太高",
      summary: "很多有价值的事，从前之所以没继续，不是因为不重要，而是推进成本太高，高到让人理性放弃。",
      composition: "暖米色纸面 / 手绘箭头 / 主标题居中偏上 / 留白底部 30%",
      img: "https://images.unsplash.com/photo-1686806372785-fcfe9efa9b70?w=900&q=80",
      state: "ok",
      provider: "mock",
    },
    {
      n: "02",
      title: "AI打破了成本壁垒，也打开了无限的可能性",
      summary: "AI 让许多原本推进不了的想法突然变得可落地，也因此放大了人生中所有值得深挖的可能性。",
      composition: "深墨绿底 / 米白衬线大字 / 引号装饰 / 右下作者签名印",
      img: "https://images.unsplash.com/photo-1760840415409-bf4b6b14988e?w=900&q=80",
      state: "ok",
      provider: "mock",
    },
    {
      n: "03",
      title: "可推进的事越多，需要做的判断就越累",
      summary: "问题不再是能不能做，而是所有方向都能做，最后最耗人的变成了无穷无尽的判断与取舍。",
      composition: "列表式构图 / 三栏编号 / 衬线小标题 / 卡片底部页脚条",
      img: "",
      state: "failed",
      provider: "mock",
    },
    {
      n: "04",
      title: "真正的疲惫，从来不是执行，是判断与收口",
      summary: "AI 不会累，但人会。真正消耗人的不是执行动作，而是反复筛选、比对、决策与强行收口。",
      composition: "纸质纹理 / 手写下划线 / 段落式版面 / 关键词以橙朱标记",
      img: "https://images.unsplash.com/photo-1778664305516-8243da9c2098?w=900&q=80",
      state: "ok",
      provider: "mock",
    },
    {
      n: "05",
      title: "做内容的执念，最容易放大这份疲惫",
      summary: "内容创作者最容易把一篇随笔升级成研究项目，最后不是表达更好了，而是被完美主义拖住了。",
      composition: "轻编辑感构图 / 大面积留白 / 中段观点强调",
      img: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=900&q=80",
      state: "ok",
      provider: "mock",
    },
    {
      n: "06",
      title: "不是少用AI，而是给自己设边界",
      summary: "不是戒掉 AI，而是学会先判断这件事值不值得做、做到什么程度够用，以及哪些方向该主动放弃。",
      composition: "收束感版面 / 低饱和深色底 / 结论居中",
      img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80",
      state: "ok",
      provider: "mock",
    },
  ],
  wechatInlineImages: [
    {
      id: "inline-01",
      placementLabel: "图片位 #1",
      sectionHeading: "以前很多事，不是不想做，是推进成本太高",
      sectionType: "concept",
      sectionTheme: "以前很多事，不是不想做，是推进成本太高",
      sectionKeywords: ["推进成本", "止步", "筛选", "精力边界"],
      sectionSummary: "很多有价值的事，从前之所以没继续，不是因为不重要，而是推进成本太高，高到让人理性放弃。",
      visualDirection: "围绕推进成本、阻力与止步感做抽象概念图，安静、克制、略带内省。",
      rationale: "用于承接第一节主观点，在首个论点段后插入，避免开头信息密度过高。",
      ratio: "16:9",
      width: 1080,
      height: 608,
      img: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1400&q=80",
      state: "ok",
      provider: "mock",
    },
    {
      id: "inline-02",
      placementLabel: "图片位 #2",
      sectionHeading: "AI打破了成本壁垒，也打开了无限的可能性",
      sectionType: "transition",
      sectionTheme: "AI打破了成本壁垒，也打开了无限的可能性",
      sectionKeywords: ["可能性", "落地", "扩张", "AI 协作"],
      sectionSummary: "AI 让许多原本推进不了的想法突然变得可落地，也因此放大了人生中所有值得深挖的可能性。",
      visualDirection: "围绕可能性打开、边界扩张和轻微眩晕感做阅读换气图。",
      rationale: "对应第二节，用于承接从高成本时代进入高可行性时代的转折。",
      ratio: "16:9",
      width: 1080,
      height: 608,
      img: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1400&q=80",
      state: "ok",
      provider: "mock",
    },
    {
      id: "inline-03",
      placementLabel: "图片位 #3",
      sectionHeading: "可推进的事越多，需要做的判断就越累",
      sectionType: "concept",
      sectionTheme: "可推进的事越多，需要做的判断就越累",
      sectionKeywords: ["判断", "取舍", "精力消耗", "边界"],
      sectionSummary: "问题不再是能不能做，而是所有方向都能做，最后最耗人的变成了无穷无尽的判断与取舍。",
      visualDirection: "围绕判断负荷、分岔路径与精力损耗做概念意象图。",
      rationale: "对应第三节，帮助长段论述中段换气。",
      ratio: "16:9",
      width: 1080,
      height: 608,
      img: "",
      state: "failed",
      provider: "mock",
    },
    {
      id: "inline-04",
      placementLabel: "图片位 #4",
      sectionHeading: "真正的疲惫，从来不是执行，是判断与收口",
      sectionType: "concept",
      sectionTheme: "真正的疲惫，从来不是执行，是判断与收口",
      sectionKeywords: ["收口", "判断", "疲惫", "人机协作"],
      sectionSummary: "AI 不会累，但人会。真正消耗人的不是执行动作，而是反复筛选、比对、决策与强行收口。",
      visualDirection: "围绕收口、停顿与精神耗损做轻概念配图。",
      rationale: "对应第四节，在核心结论段落后做视觉停顿。",
      ratio: "16:9",
      width: 1080,
      height: 608,
      img: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1400&q=80",
      state: "ok",
      provider: "mock",
    },
    {
      id: "inline-05",
      placementLabel: "图片位 #5",
      sectionHeading: "做内容的执念，最容易放大这份疲惫",
      sectionType: "transition",
      sectionTheme: "做内容的执念，最容易放大这份疲惫",
      sectionKeywords: ["内容创作", "完美主义", "随笔", "研究项目"],
      sectionSummary: "内容创作者最容易把一篇随笔升级成研究项目，最后不是表达更好了，而是被完美主义拖住了。",
      visualDirection: "围绕创作执念、轻完美主义和被放大的疲惫感做过渡图。",
      rationale: "对应第五节，帮助从认知问题过渡到内容创作现场。",
      ratio: "16:9",
      width: 1080,
      height: 608,
      img: "",
      state: "idle",
      provider: "mock",
    },
    {
      id: "inline-06",
      placementLabel: "图片位 #6",
      sectionHeading: "不是少用AI，而是给自己设边界",
      sectionType: "transition",
      sectionTheme: "不是少用AI，而是给自己设边界",
      sectionKeywords: ["边界", "止损", "够用", "松弛"],
      sectionSummary: "不是戒掉 AI，而是学会先判断这件事值不值得做、做到什么程度够用，以及哪些方向该主动放弃。",
      visualDirection: "围绕边界感、松弛感与主动收束做文章结尾的轻收口图。",
      rationale: "对应最后一节，在收束段后强调全文结论。",
      ratio: "16:9",
      width: 1080,
      height: 608,
      img: "",
      state: "idle",
      provider: "mock",
    },
  ],
  covers: [
    {
      key: "wechatCover",
      label: "公众号封面",
      ratio: "2.35 : 1",
      status: "已生成 · v2",
      img: "https://images.unsplash.com/photo-1714636608872-048fc9231892?w=1400&q=80",
      state: "ok",
      provider: "mock",
      wide: true,
    },
    {
      key: "wechatShareCover",
      label: "公众号转发封面",
      ratio: "1 : 1",
      status: "已生成 · v1",
      img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&q=80",
      state: "ok",
      provider: "mock",
    },
    {
      key: "xiaohongshuCover",
      label: "小红书封面",
      ratio: "3 : 4",
      status: "已生成 · v1",
      img: "https://images.unsplash.com/photo-1646600950096-0489e2a461cc?w=900&q=80",
      state: "ok",
      provider: "mock",
    },
  ],
  draftReview: {} as WorkspaceData["draftReview"],
};

export const workspaceData: WorkspaceData = {
  ...baseWorkspaceData,
  draftReview: buildDraftReview(baseWorkspaceData as WorkspaceData),
};
