// 从 content.html 抽取「完整 HTML 骨架库」→ 存 styles/<风格名>.json
// 用法：node scripts/extract-style.mjs <content.html> <风格名>
// 骨架库 = 每种块级排版变体（paragraph/heading/quote/list/image）的完整 HTML 骨架，
// 复刻时把新文字/图片填回 {{text}}/{{img}} 占位符，实现 1:1 无损复刻。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractSkeletonLibrary } from "./lib/skeleton.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCOUNT_DIR = join(__dirname, "../../../");

const [htmlPath, styleName] = process.argv.slice(2);
if (!htmlPath || !styleName) {
  console.error("用法：node scripts/extract-style.mjs <content.html> <风格名>");
  process.exit(1);
}

const html = readFileSync(htmlPath, "utf8");

// 从同目录 meta.json 读来源链接（fetch-article 会写）
let source = "";
const metaPath = join(dirname(htmlPath), "meta.json");
if (existsSync(metaPath)) {
  try {
    source = JSON.parse(readFileSync(metaPath, "utf8")).url || "";
  } catch {}
}

const lib = extractSkeletonLibrary(html, { name: styleName, source });

const stylesDir = join(ACCOUNT_DIR, "styles");
mkdirSync(stylesDir, { recursive: true });
const outName = styleName.replace(/[\\/:*?"<>|]/g, "");
const outPath = join(stylesDir, `${outName}.json`);
writeFileSync(outPath, JSON.stringify(lib, null, 2) + "\n", "utf8");

console.log(`已抽取骨架库 → ${outPath}`);
const byRole = {};
for (const b of lib.blocks) byRole[b.role] = (byRole[b.role] || 0) + 1;
console.log(`块变体（按角色）：${JSON.stringify(byRole)}`);
for (const [tag, s] of Object.entries(lib.inline)) {
  console.log(`强调 <${tag}>：${[s.color, s.weight, s.background].filter(Boolean).join(" / ") || "（默认）"}`);
}
