// 抽自 内容视觉工坊V2/src/app/components/wechat-layout.tsx
// markdown/正文 → 文章块（paragraph/quote/heading/list/image）的纯函数解析，零依赖。

export function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// 行内 markdown：**粗体** → <strong>
// strongStyle: { color, weight }，来自抽取的 strong 颜色/字重（不传则默认 700 纯黑）
export function inlineMarkdownToHtml(text, strongStyle = {}) {
  const { color, weight = 700 } = strongStyle;
  const style = [weight ? `font-weight:${weight}` : "", color ? `color:${color}` : ""].filter(Boolean).join(";");
  const styleAttr = style ? ` style="${style}"` : "";
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part) => {
      const match = part.match(/^\*\*([^*]+)\*\*$/);
      if (!match) return escapeHtml(part);
      return `<strong${styleAttr}>${escapeHtml(match[1])}</strong>`;
    })
    .join("");
}

// 把正文按空行切块，解析成文章块。标题 #→primary、##/###→secondary。
export function buildWechatArticleBlocks(body) {
  const chunks = body
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  const blocks = [];
  let lastSectionKey;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const markdownHeading = chunk.match(/^(#{1,3})\s+(.+)$/);

    if (/^>\s*/.test(chunk)) {
      blocks.push({
        type: "quote",
        text: chunk
          .split("\n")
          .map((line) => line.replace(/^>\s*/, ""))
          .join("\n"),
      });
      continue;
    }

    if (/^(图|图片)[:：]/.test(chunk)) {
      blocks.push({
        type: "image",
        label: chunk.replace(/^(图|图片)[:：]\s*/, ""),
        sectionKey: lastSectionKey,
      });
      continue;
    }

    const markdownImage = chunk.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (markdownImage) {
      blocks.push({
        type: "image",
        label: markdownImage[1].trim() || "公众号横图",
        imageUrl: markdownImage[2].trim(),
        sectionKey: lastSectionKey,
      });
      continue;
    }

    if (markdownHeading) {
      const hashLevel = markdownHeading[1].length;
      const title = markdownHeading[2].trim();
      const mappedLevel = mapMarkdownHeadingLevel(hashLevel);
      if (!mappedLevel) continue;
      lastSectionKey = toWechatSectionKey(title);
      blocks.push({ type: "heading", level: mappedLevel, title });
      continue;
    }

    const orderedList = parseMarkdownList(chunk, true);
    if (orderedList) {
      const items = [...orderedList];
      while (index + 1 < chunks.length) {
        const nextList = parseMarkdownList(chunks[index + 1], true);
        if (!nextList) break;
        items.push(...nextList);
        index += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    const unorderedList = parseMarkdownList(chunk, false);
    if (unorderedList) {
      const items = [...unorderedList];
      while (index + 1 < chunks.length) {
        const nextList = parseMarkdownList(chunks[index + 1], false);
        if (!nextList) break;
        items.push(...nextList);
        index += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    blocks.push({ type: "paragraph", text: chunk });
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: body.trim() }];
}

function mapMarkdownHeadingLevel(hashLevel) {
  if (hashLevel <= 1) return null;
  return hashLevel === 2 ? "primary" : "secondary";
}

function parseMarkdownList(chunk, ordered) {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const items = lines.map((line) => parseMarkdownListItem(line, ordered));
  if (items.some((item) => !item)) return null;
  return items.filter((item) => Boolean(item));
}

function parseMarkdownListItem(line, ordered) {
  if (ordered) {
    const boldNumbered = line.match(/^\*\*\d+[.、]\s*([^*]+)\*\*(.*)$/);
    if (boldNumbered) return `**${boldNumbered[1].trim()}**${boldNumbered[2] || ""}`.trim();

    return line.match(/^\d+[.、]\s*(.+)$/)?.[1]?.trim() ?? "";
  }

  const boldBulleted = line.match(/^\*\*[-*•]\s+([^*]+)\*\*(.*)$/);
  if (boldBulleted) return `**${boldBulleted[1].trim()}**${boldBulleted[2] || ""}`.trim();

  return line.match(/^[-*•]\s+(.+)$/)?.[1]?.trim() ?? "";
}

function toWechatSectionKey(value) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
