import type { GenerateCardImageRequest, GenerateCoverImageRequest } from "../types";

export function buildCardImagePrompt(request: GenerateCardImageRequest) {
  return `
请为一张中文知识卡片生成图片。

要求：
- 主题：${request.title}
- 摘要：${request.summary}
- 风格：${request.styleName}
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
- 画幅比例：${request.ratio}
- 适合公众号或小红书内容封面，强调标题区和视觉主体区
- 整体克制、高级、清晰，不要杂乱背景
- 不要自动生成大量错误中文文字
- 如果出现文字，只保留极少量、可控的中文标题感

请生成一张高质量中文内容封面图片。
`.trim();
}
