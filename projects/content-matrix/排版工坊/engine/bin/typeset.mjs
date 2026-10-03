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
const modeIdx = args.indexOf("--mode");
const MODE = modeIdx > -1 ? args[modeIdx + 1] : "standard";
const PROMPT_BY_MODE = { standard: "layout-v1.md", lively: "layout-lively.md", light: "layout-light.md" };
const refIdx = args.indexOf("--ref"); // 用本地真实成品 HTML 覆盖风格参考（复刻对照用）
const outIdx = args.indexOf("--out");
if (!mdPath || styleIdx === -1) {
  console.error("用法：node bin/typeset.mjs <成稿.md> --style <风格名或序号> [--out 目录]");
  process.exit(1);
}
if (!PROMPT_BY_MODE[MODE]) { console.error("--mode 只支持 standard | lively | light"); process.exit(1); }
const outDir = outIdx > -1 ? args[outIdx + 1] : join(dirname(fileURLToPath(import.meta.url)), "../../raw/work/gen");
mkdirSync(outDir, { recursive: true });

const article = readFileSync(mdPath, "utf8");
let style = buildStyleContext(args[styleIdx + 1], MODE);
if (refIdx > -1) {
  const refHtml = readFileSync(args[refIdx + 1], "utf8");
  style = { ...style, ref: refHtml.length > 40000 ? refHtml.slice(0, 40000) + "\n<!-- 参考截断 -->" : refHtml, chars: Math.min(refHtml.length, 40000) };
  console.log(`参考已替换为真实成品：${args[refIdx + 1]}`);
}
const system = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../prompts/" + (PROMPT_BY_MODE[MODE] || "layout-v1.md")), "utf8");
const user = `【文章内容】\n${article}\n\n【风格参考】\n${style.ref}`;

console.log(`风格：${style.name}｜模式：${MODE}（参考 ${style.chars} 字符）`);
console.log("LLM 装配中…");
const raw = await chat(system, user);
writeFileSync(join(outDir, "last-response.raw.txt"), raw, "utf8");

// 抽取 HTML：去代码围栏，取 article-root 片段
// 注意：必须同时保留 article-root 之前的 <style> 块，否则 juice 无样式可内联
function extractArticle(rawText) {
  const stripped = rawText.replace(/```(?:html)?\s*/g, "").trim();
  const m = stripped.match(/<div[^>]*id="article-root"[\s\S]*<\/div>/);
  if (!m) return null;
  const styles = stripped.slice(0, m.index).match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
  return styles.join("\n") + "\n" + m[0];
}
let html = extractArticle(raw);
if (!html) {
  console.error("LLM 响应中未找到 article-root，原始响应已存 last-response.raw.txt");
  process.exit(2);
}

// 截断检测：标签未闭合则重试一次
const opens = (html.match(/<div[\s>]/g) || []).length;
const closes = (html.match(/<\/div>/g) || []).length;
if (opens !== closes) {
  console.log("检测到标签未闭合，重试一次…");
  const retry = await chat(system, user + "\n\n（上次输出被截断：请输出完整 HTML，控制在更短篇幅）");
  writeFileSync(join(outDir, "last-response-retry.raw.txt"), retry, "utf8");
  html = extractArticle(retry);
  if (!html) { console.error("重试仍失败"); process.exit(2); }
}

// juice 内联 → 成品
const inlined = juice(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`, {
  applyStyleTags: true, removeStyleTags: true, preserveMediaQueries: false, preserveFontFaces: false,
});
const bodyM = inlined.match(/<body[^>]*>([\s\S]*)<\/body>/); // body 可能被 juice 内联上 style 属性
const final = bodyM ? bodyM[1] : html;

const name = basename(mdPath, ".md");
const outFile = join(outDir, `${name}-公众号成品-gen-${style.serial}-${style.name.split("·")[0]}-${MODE}.html`);
writeFileSync(outFile, final, "utf8");
console.log(`成品 → ${outFile}`);
console.log(`原文校验：请运行 node bin/verify.mjs ${outFile} ${mdPath}（下一步补）`);
