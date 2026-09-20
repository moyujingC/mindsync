// OpenAI 兼容 chat completion 客户端（key 只从 env 读，不打印）
const BASE = process.env.LLM_BASE_URL;
const KEY = process.env.LLM_API_KEY;
const MODEL = process.env.LLM_MODEL || "claude-sonnet-5";

if (!BASE || !KEY) {
  console.error("缺少 LLM_BASE_URL / LLM_API_KEY，请参考 .env.example 配置");
  process.exit(1);
}

export async function chat(system, user, { temperature = 0, maxTokens = 32000 } = {}) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL, temperature, max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM 请求失败 HTTP ${res.status}：${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM 响应无内容");
  return content;
}
