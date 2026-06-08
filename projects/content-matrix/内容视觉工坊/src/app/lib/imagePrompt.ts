import type { GenerateCardImageRequest, GenerateCoverImageRequest, GenerateWechatInlineImageRequest } from "../types";

export function buildCardImagePrompt(request: GenerateCardImageRequest) {
  return `
请为一张中文知识卡片生成图片。

要求：
- 主题：${request.title}
- 摘要：${request.summary}
- 风格：${request.styleName}
- 风格基底：${request.stylePromptBase}
- 画幅比例：${request.ratio}
- 体现知识卡片、观点卡片、信息图的版式感
- 整体克制，适合公众号正文配图和小红书知识卡
- 不要出现杂乱背景
- 不要自动生成大量错误中文文字
- 保留明确文字区域与视觉主体区域

请生成一张高质量知识卡片图片。
`.trim();
}

export function buildCoverImagePrompt(request: GenerateCoverImageRequest) {
  return `
请为中文内容封面生成图片。

要求：
- 封面类型：${request.label}
- 文章标题：${request.articleTitle}
- 封面主题：${request.coverThemeTitle}
- 关键词：${request.coverThemeKeywords}
- 风格：${request.styleName}
- 风格基底：${request.stylePromptBase}
- 画幅比例：${request.ratio}
- 适合公众号或小红书内容封面，强调标题区和视觉主体区
- 整体克制、高级、清晰，不要杂乱背景
- 不要自动生成大量错误中文文字
- 如果出现文字，只保留极少量、可控的中文标题感

请生成一张高质量中文内容封面图片。
`.trim();
}

export function buildWechatInlineImagePrompt(request: GenerateWechatInlineImageRequest) {
  return `
你正在为一篇中文公众号长文生成“正文配图”。

这张图的用途是插入文章正文中段，服务阅读节奏和段落主题强化。
它不是封面图，不是知识卡片，不是海报，也不是营销图。

请始终遵守以下要求：
- 横版编辑插图，适配公众号正文宽度
- 留白充足，克制，安静，有编辑感
- 不做大段可读文字
- 不做知识卡片式信息罗列
- 不做封面式强标题
- 不做多模块、多信息块排版
- 不使用夸张营销视觉
- 不让图片抢走正文注意力
- 更像中文杂志内页插图、概念插图、编辑配图
- 只表达当前段落的一个核心意象，不试图讲完整观点
- 风格统一、稳定、可连续用于同一篇文章

【段落类型】
${request.sectionType}

【文章主题】
${request.articleTheme}

【当前段落主题】
${request.sectionTheme}

【关键词】
${request.sectionKeywords.join(" / ")}

【段落摘要】
${request.sectionSummary}

【当前金句】
${request.sectionQuote || "无"}

【视觉任务】
${request.visualDirection}

【风格参考】
${request.styleName}

【风格基底】
${request.stylePromptBase}

【构图要求】
- 横版
- 比例：${request.ratio}
- 留白充足
- 画面简洁
- 适合插入公众号正文中段
- 不出现大段文字
- 不做卡片排版

【输出目标】
生成一张适合作为公众号正文中段配图的编辑插图。
`.trim();
}
