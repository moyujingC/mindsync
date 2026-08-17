// 从 content.html 抽取排版风格 → 存 styles/<风格名>.json
// 用法：node scripts/extract-style.mjs <content.html> <风格名>

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractStyleSpec } from "./lib/style-spec.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCOUNT_DIR = join(__dirname, "../../../");

const [htmlPath, styleName] = process.argv.slice(2);
if (!htmlPath || !styleName) {
  console.error("用法：node scripts/extract-style.mjs <content.html> <风格名>");
  process.exit(1);
}

const html = readFileSync(htmlPath, "utf8");

let source = "";
const metaPath = join(dirname(htmlPath), "meta.json");
if (existsSync(metaPath)) {
  try {
    source = JSON.parse(readFileSync(metaPath, "utf8")).url || "";
  } catch {}
}

const spec = extractStyleSpec(html, { name: styleName, source });

const stylesDir = join(ACCOUNT_DIR, "styles");
mkdirSync(stylesDir, { recursive: true });
const outName = styleName.replace(/[\\/:*?"<>|]/g, "");
const outPath = join(stylesDir, `${outName}.json`);
writeFileSync(outPath, JSON.stringify(spec, null, 2) + "\n", "utf8");

console.log(`已抽取风格 → ${outPath}`);
console.log(`正文：${spec.typography.body.size}px / 行高 ${spec.typography.body.lineHeight} / ${spec.colors.body}`);
console.log(`标题：${spec.typography.title.sizeRatio}x / ${spec.colors.title}`);
console.log(`小节标题：${spec.typography.headingPrimary.sizeRatio}x / ${spec.colors.heading}`);
console.log(`强调：weight ${spec.typography.strong.weight} / ${spec.colors.strong}`);
