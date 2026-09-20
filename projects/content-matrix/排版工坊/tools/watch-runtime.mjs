// HiStyle 运行时截获看守：轮询系统临时目录，发现 histyle-codex-home-* / workspace-* /
// claude-workspace-* 立即快照到 runtime-capture/（提示词、AGENTS 指令、会话日志都在里面）。
// 用法：node tools/watch-runtime.mjs [最长运行分钟，默认 30]
import { readdirSync, statSync, cpSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const WATCH_DIR = os.tmpdir();
const OUT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../runtime-capture/");
const PATTERNS = ["histyle-codex-home-", "histyle-codex-workspace-", "histyle-claude-workspace-"];
const maxMin = Number(process.argv[2] || 30);
mkdirSync(OUT_ROOT, { recursive: true });
const log = (m) => { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); appendFileSync(join(OUT_ROOT, "capture.log"), line + "\n"); };
log(`看守启动，监视 ${WATCH_DIR}，最长 ${maxMin} 分钟`);

const copied = new Map(); // dir -> lastSignature
const snapshot = (dir) => {
  const dest = join(OUT_ROOT, dir);
  try {
    cpSync(join(WATCH_DIR, dir), dest, { recursive: true, force: true });
    return true;
  } catch (e) { return false; }
};
const signature = (dir) => {
  try {
    let sig = 0;
    const walk = (p) => { for (const f of readdirSync(p, { withFileTypes: true })) { const fp = join(p, f.name); if (f.isDirectory()) walk(fp); else { const s = statSync(fp); sig += s.size + +new Date(s.mtime); } } };
    walk(join(WATCH_DIR, dir));
    return sig;
  } catch { return -1; }
};

const deadline = Date.now() + maxMin * 60 * 1000;
while (Date.now() < deadline) {
  let found = [];
  try { found = readdirSync(WATCH_DIR).filter((d) => PATTERNS.some((p) => d.startsWith(p))); } catch {}
  for (const d of found) {
    const sig = signature(d);
    if (copied.get(d) !== sig) {
      if (snapshot(d)) { copied.set(d, sig); log(`快照更新 → runtime-capture/${d}（sig=${sig}）`); }
    }
  }
  if (found.length === 0 && copied.size > 0 && [...found].every((d) => !copied.has(d) || true)) {
    // 目录被清理即视为本轮生成结束
  }
  // 全部已知目录消失 → 退出
  if (copied.size > 0 && found.length === 0) { log("HiStyle 临时目录已清理，生成结束，看守退出"); break; }
  await new Promise((r) => setTimeout(r, 1500));
}
log(`看守结束，共截获 ${copied.size} 个目录：${[...copied.keys()].join(", ") || "（无）"}`);
