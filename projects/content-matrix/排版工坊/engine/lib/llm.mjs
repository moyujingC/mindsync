// OpenAI 兼容 chat completion 客户端（key 只从 env 读，不打印）
const BASE = process.env.LLM_BASE_URL;
const KEY = process.env.LLM_API_KEY;
const MODEL = process.env.LLM_MODEL || "claude-sonnet-5";

if (!BASE || !KEY) {
  console.error("缺少 LLM_BASE_URL / LLM_API_KEY，请参考 .env.example 配置");
  process.exit(1);
}

export async function chat(system, user, { temperature = Number(process.env.LLM_TEMPERATURE ?? 0), maxTokens = Number(process.env.LLM_MAX_TOKENS ?? 32000) } = {}) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL, temperature, max_tokens: maxTokens, stream: true,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM 请求失败 HTTP ${res.status}：${text.slice(0, 300)}`);
  }
  // SSE 流式累积：响应头即刻返回，规避非流式整段等待的超时问题
  let content = "";
  let buf = "";
  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
        if (delta) content += delta;
      } catch { /* 忽略非 JSON 行 */ }
    }
  }
  if (!content) throw new Error("LLM 响应无内容");
  return content;
}
