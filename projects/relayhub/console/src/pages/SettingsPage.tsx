import { useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { getRelayAccessSummary, saveRelayAccessToken } from "../services/controlPlane";

export function SettingsPage() {
  const [version, setVersion] = useState(0);
  const [relayTokenDraft, setRelayTokenDraft] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const relayAccess = useAsyncResource(() => getRelayAccessSummary(), [version]);

  useEffect(() => {
    if (relayAccess.status === "success" && relayAccess.data) {
      setRelayTokenDraft("");
    }
  }, [relayAccess.status, relayAccess.data]);

  async function handleSave() {
    setFeedback(null);
    setError(null);
    setIsSaving(true);

    try {
      const result = await saveRelayAccessToken(relayTokenDraft);
      setVersion((current) => current + 1);
      setFeedback(
        result.hasStoredRelayToken
          ? "RelayHub 门禁 token 已保存。以后 Paperclip、Claude、Codex 访问 RelayHub 时会先认这把门禁卡。"
          : "RelayHub 门禁 token 已清空。当前会退回环境变量口径；如果环境变量也没有，中转入口会拒绝访问。",
      );
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "RelayHub 门禁 token 保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>管理谁能调用 RelayHub 中转 API</h1>
          <p>
            这里管理的是 RelayHub 数据面的门禁 token，也就是“谁能进 RelayHub 这道门”。它不是上游模型厂商的 API Key。
          </p>
        </div>
      </section>

      {feedback ? <p className="form-success">{feedback}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <Section
        title="Relay 门禁"
        description="给 Paperclip、Claude、Codex 这些客户端发统一门禁卡。改这里，会影响谁能调用 RelayHub 数据面。"
      >
        {relayAccess.status === "loading" ? (
          <EmptyState title="正在读取门禁配置" description="正在加载当前 RelayHub 门禁 token 状态。" />
        ) : relayAccess.status === "error" ? (
          <EmptyState title="读取失败" description={relayAccess.error ?? "暂时无法读取 RelayHub 门禁 token 状态。"} />
        ) : relayAccess.data ? (
          <div className="data-card">
            <p>当前状态：{relayAccess.data.maskedRelayToken ?? "未配置"}</p>
            <p className="supporting-text">当前生效来源：{formatSource(relayAccess.data.effectiveSource)}</p>
            <p className="supporting-text">最近更新：{relayAccess.data.updatedAt ?? "还没有通过控制台保存过"}</p>

            <label className="field-label" htmlFor="relay-token-input">
              新的 RelayHub 门禁 token
            </label>
            <input
              id="relay-token-input"
              type="password"
              value={relayTokenDraft}
              onChange={(event) => setRelayTokenDraft(event.target.value)}
              placeholder="留空表示清空控制台托管值"
              autoComplete="off"
            />
            <p className="supporting-text">
              这把 token 是给客户端访问 RelayHub 用的门禁卡。它不是 RelayHub 去请求 OpenAI、Anthropic、DeepSeek 时用的厂商密钥。
            </p>

            <div className="inline-actions">
              <button type="button" className="button-link" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "正在保存..." : "保存门禁 token"}
              </button>
            </div>
          </div>
        ) : (
          <EmptyState title="没有可用的门禁状态" description="当前还没有读到 RelayHub 门禁 token 摘要。" />
        )}
      </Section>
    </div>
  );
}

function formatSource(source: "control-plane" | "environment" | "missing") {
  if (source === "control-plane") {
    return "控制台托管值";
  }
  if (source === "environment") {
    return "服务器环境变量兜底";
  }
  return "未配置";
}
