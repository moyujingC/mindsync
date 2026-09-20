// 生成式排版引擎 M1 CLI
// 用法：
//   node bin/typeset.mjs --list-styles
//   node bin/typeset.mjs <成稿.md> --style <风格名或序号> [--out 输出目录]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { basename, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// .env 加载（引擎目录下）
const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const juice = (await import("juice")).default;
const { chat } = await import("../lib/llm.mjs");
const { buildStyleContext, listStyles } = await import("../lib/style-context.mjs");

const args = process.argv.slice(2);
if (args.includes("--list-styles")) {
  for (const s of listStyles()) console.log(`${String(s.serial).padStart(3, "0")} ${s.name} (${s.tier})`);
  process.exit(0);
}
const mdPath = args.find((a) => a.endsWith(".md"));
const styleIdx = args.indexOf("--style");
const outIdx = args.indexOf("--out");
if (!mdPath || styleIdx === -1) {
  console.error("用法：node bin/typeset.mjs <成稿.md> --style <风格名或序号> [--out 目录]");
  process.exit(1);
}
const outDir = outIdx > -1 ? args[outIdx + 1] : join(dirname(fileURLToPath(import.meta.url)), "../../raw/work/gen");
mkdirSync(outDir, { recursive: true });

const article = readFileSync(mdPath, "utf8");
const style = buildStyleContext(args[styleIdx + 1]);
const system = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../prompts/layout-v1.md"), "utf8");
const user = `【文章内容】\n${article}\n\n【风格参考】\n${style.ref}`;

console.log(`风格：${style.name}（参考 ${style.chars} 字符）`);
console.log("LLM 装配中…");
const raw = await chat(system, user);
writeFileSync(join(outDir, "last-response.raw.txt"), raw, "utf8");

// 抽取 HTML：去代码围栏，取 article-root 片段
let html = raw.replace(/```(?:html)?\s*/g, "").trim();
const m = html.match(/<div[^>]*id="article-root"[\s\S]*<\/div>/);
if (!m) {
  console.error("LLM 响应中未找到 article-root，原始响应已存 last-response.raw.txt");
  process.exit(2);
}
html = m[0];

// 截断检测：标签未闭合则重试一次
const opens = (html.match(/<div[\s>]/g) || []).length;
const closes = (html.match(/<\/div>/g) || []).length;
if (opens !== closes) {
  console.log("检测到标签未闭合，重试一次…");
  const retry = await chat(system, user + "\n\n（上次输出被截断：请输出完整 HTML，控制在更短篇幅）");
  writeFileSync(join(outDir, "last-response-retry.raw.txt"), retry, "utf8");
  const m2 = retry.replace(/```(?:html)?\s*/g, "").match(/<div[^>]*id="article-root"[\s\S]*<\/div>/);
  if (!m2) { console.error("重试仍失败"); process.exit(2); }
  html = m2[0];
}

// juice 内联 → 成品
const inlined = juice(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`, {
  applyStyleTags: true, removeStyleTags: true, preserveMediaQueries: false, preserveFontFaces: false,
});
const bodyM = inlined.match(/<body>([\s\S]*)<\/body>/);
const final = bodyM ? bodyM[1] : html;

const name = basename(mdPath, ".md");
const outFile = join(outDir, `${name}-公众号成品-gen-${style.serial}-${style.name.split("·")[0]}.html`);
writeFileSync(outFile, final, "utf8");
console.log(`成品 → ${outFile}`);
console.log(`原文校验：请运行 node bin/verify.mjs ${outFile} ${mdPath}（下一步补）`);
