// 一镜一梳插画拼贴卡 · 配图生成器（薄封装）
// 风格 prompt 单一源头在 yijinyishu-watercolor-style/scripts/generate.mjs，
// 本脚本只负责转发，保持原 CLI 不变：
//   node generate_art.mjs <prompt.txt|纯文本> <out.png> [portrait|landscape] [--bleed]
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = dirname(fileURLToPath(import.meta.url));
const gen = join(skillDir, "../../yijinyishu-watercolor-style/scripts/generate.mjs");

const r = spawnSync(process.execPath, [gen, ...process.argv.slice(2)], { stdio: "inherit" });
if (r.error) { console.error(r.error.message); process.exit(1); }
process.exit(r.status ?? 1);
