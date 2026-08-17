// 用「骨架库」给成稿排版 → 公众号草稿 HTML（内联样式，可粘贴到公众号编辑器）。
// 用法：node scripts/render-wechat.mjs <成稿.md> <styles/风格名.json>
// 原理：把成稿解析成文章块（paragraph/quote/list/image/heading），
//       每块套用骨架库里同角色的 HTML 骨架，把新文字/图片填回 {{text}}/{{img}} 占位符。

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { renderArticleBody } from "./lib/render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCOUNT_DIR = join(__dirname, "../../../");

const [mdPath, libPath] = process.argv.slice(2);
if (!mdPath || !libPath) {
  console.error("用法：node scripts/render-wechat.mjs <成稿.md> <styles/风格名.json>");
  process.exit(1);
}

const md = readFileSync(mdPath, "utf8");
const lib = JSON.parse(readFileSync(libPath, "utf8"));

const { title, body } = extractArticle(md);
const html = renderArticleBody(body, lib);

const styleName = basename(libPath).replace(/\.json$/, "");
const outName = `${basename(mdPath).replace(/\.md$/, "")}-公众号成品-${styleName}.html`;
const outPath = join(ACCOUNT_DIR, outName);
writeFileSync(outPath, html, "utf8");

console.log(`文章标题：${title || "(未取到)"}  ← 请填到公众号标题栏`);
console.log(`已生成 → ${outPath}`);

// 提取文章标题 + 正文：丢弃第一个 # 标题行之前的元数据引用块。
function extractArticle(md) {
  const lines = md.split("\n");
  let title = "";
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+)$/);
    if (m) {
      title = m[1].trim();
      bodyStart = i + 1;
      break;
    }
  }
  const body = lines.slice(bodyStart).join("\n").trim();
  return { title, body };
}
