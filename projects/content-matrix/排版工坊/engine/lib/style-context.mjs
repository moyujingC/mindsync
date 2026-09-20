// 构建风格上下文：从排版工坊 raw 归档定位样章（标准版），抽取 <style> + article-root 结构作参考
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const LIB = JSON.parse(readFileSync(join(ROOT, "raw/style-library.json"), "utf8"));
const STYLES = LIB.state.styles;
const MAX_REF_CHARS = 24000; // 参考 HTML 截断上限（含 style）

export function listStyles() {
  return STYLES.map((s) => ({ serial: s.serialNumber, name: s.name, tier: s.accessTier }));
}

export function buildStyleContext(styleName) {
  const s = STYLES.find((x) => x.name === styleName || String(x.serialNumber) === String(styleName));
  if (!s) throw new Error(`风格不存在：${styleName}（用 --list-styles 看全部）`);
  const main = s.showcaseFiles.find((f) => /showcase-new-0/.test(f.downloadUrl) && !/灵动/.test(f.originalName))
    || s.showcaseFiles.find((f) => /showcase-new-0/.test(f.downloadUrl));
  const file = join(ROOT, "raw/style-assets", s.id, "assets", main.downloadUrl.split("/assets/")[1]);
  if (!existsSync(file)) throw new Error(`样章缺失：${file}`);
  const html = readFileSync(file, "utf8");
  // 抽取 <style> 块 + article-root 内部 HTML（截断）
  const styleM = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const rootM = html.match(/<div[^>]*id="article-root"[^>]*>([\s\S]*?)<\/div>\s*<\/body>/);
  const css = styleM ? styleM[1] : "";
  const body = rootM ? rootM[1] : html;
  let ref = `<style>${css}</style>\n<div id="article-root">${body}</div>`;
  if (ref.length > MAX_REF_CHARS) ref = ref.slice(0, MAX_REF_CHARS) + "\n<!-- 参考截断 -->";
  return { name: s.name, serial: s.serialNumber, ref, chars: ref.length };
}
