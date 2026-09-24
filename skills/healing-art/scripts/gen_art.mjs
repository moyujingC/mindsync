// 一镜一梳 疗愈文生图：gpt-image-2（经 relay，key 读排版工坊 engine/.env）
// 用法：
//   node scripts/gen_art.mjs --prompt "完整英文提示词" --out <路径> [--size 3:4|1:1|4:3] [--quality low|medium|high]
//   node scripts/gen_art.mjs --recipe cover --mood calm --out <路径>   # 配方速出
// 配方见 references/style-recipes.md。默认 size 3:4（小红书竖图），quality low（草稿），定稿用 medium+。
import { existsSync } from "node:fs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const out = arg("out");
if (!out) { console.error("用法：node scripts/gen_art.mjs --prompt/--recipe ... --out <路径> [--size 3:4] [--quality low]"); process.exit(1); }

const SIZE = arg("size", "3:4");
const QUALITY = arg("quality", "low");
const R = { "3:4": [1080, 1440], "1:1": [1080, 1080], "4:3": [1440, 1080], "3:2": [1440, 960] };
const [tw, th] = R[SIZE] || R["3:4"];

// 配方 = 基底风格锚（写死，保证账号视觉统一）+ 情绪/构图变量
const BASE = "hand-painted mandala artwork, watercolor and colored pencil on textured cream paper, muted low-saturation palette, soft diffused natural light, gentle radial symmetry around a quiet center, slow natural growth feeling, calming healing aesthetic, generous negative space, no text, no letters, no watermark";
const RECIPES = {
  // 满幅主曼陀罗：适合做笔记首图/封面底图（配卡片模板打底或叠加文字）
  cover: `${BASE}, one large detailed mandala filling most of the frame, layered concentric petals and rings, {{MOOD_TONES}}, center slightly above middle`,
  // 角落生长：曼陀罗从画面一角展开，大量留白给文字
  corner: `${BASE}, a small mandala growing from the lower corner, vines and petals slowly expanding outward, large quiet empty area in upper half, {{MOOD_TONES}}`,
  // 纹理底：极淡的大面积纸纹+远观纹样，当卡片/海报底图
  texture: `${BASE}, extremely faint oversized mandala pattern as background texture, barely visible lines, almost plain cream paper, {{MOOD_TONES}}`,
};
const MOODS = {
  calm:   "warm sand, oat, and soft terracotta tones",              // 安定（默认）
  sorrow: "dusty blue, grey lavender, and muted ink tones",         // 低落/委屈
  anxiety:"sage green, pale moss, and warm grey tones",             // 焦虑/紧绷
  warm:   "dusty rose, warm apricot, and soft brown tones",        // 温暖/感恩
};

const recipe = arg("recipe");
let prompt = arg("prompt");
if (!prompt) {
  if (!RECIPES[recipe]) { console.error("--recipe 只支持：cover | corner | texture（或直接用 --prompt）"); process.exit(1); }
  const mood = MOODS[arg("mood", "calm")] || MOODS.calm;
  prompt = RECIPES[recipe].replace("{{MOOD_TONES}}", mood);
}

const { genImage, fitSize } = await import("/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/排版工坊/engine/lib/img.mjs");
const size = fitSize(tw, th);
console.log(`生图中… ${size.width}x${size.height} ${QUALITY}`);
for (let i = 1; i <= 4; i++) {
  try { await genImage({ prompt, size, quality: QUALITY, out }); break; }
  catch (e) { if (i === 4) throw e; console.log(`第 ${i} 次失败（${e.message.slice(0, 60)}），15s 后重试…`); await new Promise(r => setTimeout(r, 15000)); }
}
console.log("✓ → " + out);
