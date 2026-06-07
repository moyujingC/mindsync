import type { GenerateCardImageRequest } from "../types";

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
