// 批量复刻：HiStyle 风格样章 → 骨架库 JSON（预处理内联 + 抽取 + 容器修正）
// 用法：node tools/replicate-style.mjs <风格名> [风格名...]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import juice from "juice";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = join(ROOT, "raw");
const SKILL = join(ROOT, "../accounts/墨予镜/skills/wechat-style-replicator");
const ACCOUNT = join(ROOT, "../accounts/墨予镜");
const WORK = join(ROOT, "raw/work");
mkdirSync(WORK, { recursive: true });

const lib = JSON.parse(readFileSync(join(RAW, "style-library.json"), "utf8"));
const styles = lib.state.styles;

for (const name of process.argv.slice(2)) {
  const s = styles.find((x) => x.name === name);
  if (!s) { console.log(`✗ 未找到风格：${name}`); continue; }
  const serial = String(s.serialNumber).padStart(3, "0");
  // 1. 定位标准版样章（showcase-new-0，非灵动版优先）
  const main = s.showcaseFiles.find((f) => /showcase-new-0/.test(f.downloadUrl) && !/灵动/.test(f.originalName))
    || s.showcaseFiles.find((f) => /showcase-new-0/.test(f.downloadUrl));
  const fileName = main.downloadUrl.split("/assets/")[1];
  const src = join(RAW, "style-assets", s.id, "assets", fileName);
  if (!existsSync(src)) { console.log(`✗ 样章缺失：${name}`); continue; }
  // 2. 预处理：解析 CSS 变量 + juice 内联
  let html = readFileSync(src, "utf8");
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const css = styleMatch[1];
  const vars = {};
  for (const m of css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]+);/g)) vars[m[1]] = m[2].trim();
  let resolved = css;
  for (let i = 0; i < 3; i++) resolved = resolved.replace(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g, (a, n) => vars[n] ?? a);
  html = html.replace(styleMatch[1], resolved);
  const inlined = juice(html, { applyStyleTags: true, removeStyleTags: false, preserveMediaQueries: false, preserveFontFaces: false });
  const inlinedPath = join(WORK, `${serial}.html`);
  writeFileSync(inlinedPath, inlined, "utf8");
  // 3. 抽取骨架
  const styleKey = `histyle-${serial}-${name.split("·")[0]}`;
  execFileSync("node", [join(SKILL, "scripts/extract-style.mjs"), inlinedPath, styleKey], { stdio: "pipe" });
  // 4. 容器修正为 #article-root
  const libPath = join(ACCOUNT, "styles", `${styleKey}.json`);
  const skel = JSON.parse(readFileSync(libPath, "utf8"));
  const rootM = inlined.match(/<(?:section|div)[^>]*id="article-root"[^>]*>/);
  if (rootM) {
    const tag = rootM[0].match(/^<(\w+)/)[1];
    const style = (rootM[0].match(/style="([^"]*)"/) || [])[1] || "";
    skel.container = `<${tag} style="${style}">{{content}}</${tag}>`;
  }
  skel.source = `HiStyle ${serial} ${name}（个人复刻，内部使用）`;
  writeFileSync(libPath, JSON.stringify(skel, null, 2) + "\n");
  const roles = {};
  for (const b of skel.blocks) roles[b.role] = (roles[b.role] || 0) + 1;
  console.log(`✓ ${styleKey} | 块变体 ${JSON.stringify(roles)}`);
}
