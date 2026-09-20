// HiStyle showcase HTML → 内联样式版（解析 CSS 变量 → juice 内联），供骨架抽取
import { readFileSync, writeFileSync } from "node:fs";
import juice from "juice";

const [inPath, outPath] = process.argv.slice(2);
let html = readFileSync(inPath, "utf8");

// 1. 抽取 <style> 内容，解析 :root 变量并做全局替换
const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
if (!styleMatch) { console.error("no <style> found"); process.exit(1); }
const css = styleMatch[1];
const vars = {};
for (const m of css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]+);/g)) vars[m[1]] = m[2].trim();
let resolvedCss = css;
for (let pass = 0; pass < 3; pass++) {
  resolvedCss = resolvedCss.replace(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g, (all, name) => vars[name] ?? all);
}
// 2. 用解析后的 CSS 替换原 <style>
html = html.replace(styleMatch[1], resolvedCss);

// 3. juice 内联（保留 style 标签以便复查，真正抽取时会忽略）
const inlined = juice(html, {
  applyStyleTags: true,
  removeStyleTags: false,
  preserveMediaQueries: false,
  preserveFontFaces: false,
});
writeFileSync(outPath, inlined, "utf8");
console.log(`内联完成 → ${outPath} (${inlined.length} bytes)`);
