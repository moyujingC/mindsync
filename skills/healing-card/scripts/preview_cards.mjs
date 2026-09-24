// 文字稿导出：cards.json → 可自由编辑的 Markdown 文字稿（给人审改，不用于回渲）
// 用法：node preview_cards.mjs <cards.json> <文字稿.md>
import { readFileSync, writeFileSync } from "node:fs";

const [jsonPath, outPath] = process.argv.slice(2);
if (!jsonPath || !outPath) { console.error("用法：node preview_cards.mjs <cards.json> <文字稿.md>"); process.exit(1); }
const cards = JSON.parse(readFileSync(jsonPath, "utf8"));

const esc = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
const txt = (html) => esc(html.replace(/<[^>]+>/g, "").trim());

// content HTML → 分段标记文本
function contentToText(content) {
  let s = content;
  const out = [];
  const push = (label, body) => out.push(`${label}${body}\n`);
  // h1 标题
  s = s.replace(/<h1 class='title(-xl)?'>([\s\S]*?)<\/h1>/g, (_, _x, m) => { push("【标题】", txt(m)); return "\n"; });
  // 金句横幅
  s = s.replace(/<div class='banner'>([\s\S]*?)<\/div>/g, (_, m) => { push("【金句横幅】", txt(m)); return "\n"; });
  // lead / lead-sm
  s = s.replace(/<div class='lead-sm'>([\s\S]*?)<\/div>/g, (_, m) => { push("【说明】", txt(m)); return "\n"; });
  s = s.replace(/<div class='lead'>([\s\S]*?)<\/div>/g, (_, m) => { push("【主张】", txt(m)); return "\n"; });
  // kicker + kicker-text 成对
  s = s.replace(/<div class='kicker'>([\s\S]*?)<\/div>\s*<div class='kicker-text'>([\s\S]*?)<\/div>/g,
    (_, k, m) => { push(`【标签 ${txt(k)}】`, txt(m)); return "\n"; });
  // num-item（.t 与 .d 嵌套在同一节点内）
  s = s.replace(/<div class='num-item'><div class='t'>([\s\S]*?)<\/div><div class='d'>([\s\S]*?)<\/div><\/div>/g,
    (_, t, d) => { push("【条目】", `${txt(t)}——${txt(d)}`); return "\n"; });
  // group-label
  s = s.replace(/<div class='group-label'>([\s\S]*?)<\/div>/g, (_, m) => { push("【分组】", txt(m)); return "\n"; });
  // blist
  s = s.replace(/<ul class='blist'>([\s\S]*?)<\/ul>/g, (_, m) => {
    m.replace(/<li>([\s\S]*?)<\/li>/g, (_, li) => { push("【列表】", txt(li)); return ""; });
    return "\n";
  });
  return out.join("\n");
}

let md = `# 简报文字稿（${cards.length} 张）\n\n> 可自由编辑。确认后回复「确认」，再渲染出图。\n> 规则：一张卡一个标题；金句横幅最多两行；条目宁删勿挤。\n\n`;
cards.forEach((c, i) => {
  md += `---\n\n## 第 ${i + 1} 张 · ${c.name} · ${c.theme === "theme-dark" ? "深色简报" : "浅色简报"}\n\n`;
  md += contentToText(c.content);
  md += "\n";
});
writeFileSync(outPath, md);
console.log("✓ 文字稿 → " + outPath);
