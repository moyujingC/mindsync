// 运行时进程间谍 v4：基线 diff —— 记录生成期间「所有新出现的进程」，不再猜名字。
// 同时递归监视 $TMPDIR 新建文件。发现即 dump 环境变量。
// 用法：node tools/spy-runtime.mjs [最长运行分钟，默认 120]
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const OUT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../runtime-capture/");
const TMP = os.tmpdir();
const maxMin = Number(process.argv[2] || 120);
mkdirSync(OUT_ROOT, { recursive: true });
const log = (m) => { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); appendFileSync(join(OUT_ROOT, "spy.log"), line + "\n"); };
log(`间谍v4启动（全量进程diff + TMPDIR递归监视），最长 ${maxMin} 分钟`);

const NOISE = /grep|spy-runtime|watch-runtime|fs_usage|kernel_task|mdworker|ps axo|^\s*ps\s/i;
const listProc = () => {
  try {
    const out = execFileSync("ps", ["axo", "pid,lstart,command"], { encoding: "utf8" });
    const map = {};
    for (const line of out.split("\n")) {
      const m = line.trim().match(/^(\d+)\s+(\w{3} \w{3} \d+ [\d:]+ \d{4})\s+(.*)$/);
      if (m) map[m[1]] = m[3];
    }
    return map;
  } catch { return {}; }
};
const dumpEnv = (pid) => {
  try { return execFileSync("ps", ["eww", "-p", pid], { encoding: "utf8" }); } catch { return ""; }
};

let baseline = listProc();
const dumped = new Set();
log(`基线进程数：${Object.keys(baseline).length}`);
const deadline = Date.now() + maxMin * 60 * 1000;
while (Date.now() < deadline) {
  const now = listProc();
  for (const [pid, cmd] of Object.entries(now)) {
    if (baseline[pid] !== undefined || dumped.has(pid)) continue;
    if (NOISE.test(cmd)) continue;
    dumped.add(pid);
    writeFileSync(join(OUT_ROOT, `new-proc-${pid}.txt`), cmd + "\n\n=== ENV ===\n" + dumpEnv(pid), "utf8");
    log(`新进程 pid=${pid}：${cmd.slice(0, 220)}`);
  }
  baseline = now;
  await new Promise((r) => setTimeout(r, 1000));
}
log(`间谍结束，新捕获 ${dumped.size} 个进程`);
