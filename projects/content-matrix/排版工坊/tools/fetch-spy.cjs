// fetch 间谍（NODE_OPTIONS=--require 预载）：包装 globalThis.fetch 与 require('undici')，
// 把 histyle.top API 的请求/响应落盘到 SPY_OUT 目录。仅本地截获，不改动任何数据。
const fs = require("fs");
const path = require("path");
const OUT = process.env.SPY_OUT || "/tmp/fetch-spy";
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const log = (m) => { try { fs.appendFileSync(path.join(OUT, "spy.log"), `[${new Date().toISOString()}] ${m}\n`); } catch {} };
log("fetch-spy 预载成功 pid=" + process.pid);

const INTEREST = /prompts\/resolve|generation-permits|\/api\/styles|generate|runtime-integrity|samples/;
let seq = 0;

function wrapFetch(orig, label) {
  if (!orig || orig.__spied) return orig;
  const wrapped = async function (input, init) {
    const url = typeof input === "string" ? input : input && input.url || "";
    const interesting = /histyle\.top/.test(url) && INTEREST.test(url);
    const reqBody = init && init.body ? String(init.body).slice(0, 200000) : null;
    const res = await orig.apply(this, arguments);
    if (interesting) {
      const id = ++seq;
      try {
        const clone = res.clone();
        clone.text().then((text) => {
          const headers = {};
          try { res.headers.forEach((v, k) => (headers[k] = v)); } catch {}
          fs.writeFileSync(path.join(OUT, `flow-${String(id).padStart(3, "0")}.json`), JSON.stringify({
            at: new Date().toISOString(), label, url, method: (init && init.method) || "GET",
            status: res.status, reqBody, respHeaders: headers, respBody: text,
          }, null, 2));
          log(`捕获 ${id} ${url} (${text.length} bytes)`);
        }).catch(() => {});
      } catch (e) { log("捕获失败 " + url + "：" + e.message); }
    }
    return res;
  };
  wrapped.__spied = true;
  return wrapped;
}

globalThis.fetch = wrapFetch(globalThis.fetch, "global");
try {
  const Module = require("module");
  const origLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    const mod = origLoad.apply(this, arguments);
    if (request === "undici" && mod && mod.fetch && !mod.__spied) {
      try {
        Object.defineProperty(mod, "fetch", { value: wrapFetch(mod.fetch, "undici"), configurable: true });
        mod.__spied = true;
        log("undici.fetch 已包装");
      } catch (e) { log("undici 包装失败：" + e.message); }
    }
    return mod;
  };
} catch (e) { log("Module hook 失败：" + e.message); }
