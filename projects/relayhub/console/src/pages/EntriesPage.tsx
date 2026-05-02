import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { EntryBinding, EntryBindingResolution, ReasoningEffort } from "../models/controlPlane";
import { listEntryBindingResolutions, saveEntryBinding } from "../services/controlPlane";

const RELAY_TOKEN_NAME = "RELAYHUB_RELAY_TOKEN";
const REASONING_OPTIONS: Array<{ value: "" | ReasoningEffort; label: string }> = [
  { value: "", label: "跟随模型" },
  { value: "low", label: "low（想得浅）" },
  { value: "medium", label: "medium（想得中）" },
  { value: "high", label: "high（想得深）" },
];

export function EntriesPage() {
  const [version, setVersion] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const [overrideDrafts, setOverrideDrafts] = useState<Record<string, string>>({});
  const resolutions = useAsyncResource(() => listEntryBindingResolutions(), [version]);

  const paperclipEntries = useMemo(
    () => (resolutions.data ?? []).filter((item) => item.clientFamily === "paperclip"),
    [resolutions.data],
  );
  const observeOnlyEntries = useMemo(
    () => (resolutions.data ?? []).filter((item) => item.protocolFamily === "observe-only"),
    [resolutions.data],
  );

  function resolveDraftValue(entry: EntryBindingResolution) {
    const draft = overrideDrafts[entry.entryId];
    if (draft !== undefined) {
      return draft;
    }
    return entry.reasoningEffortOverride ?? "";
  }

  async function handleOverrideSave(entry: EntryBindingResolution) {
    setFeedback(null);
    setError(null);
    setSavingEntryId(entry.entryId);

    try {
      const nextOverride = normalizeDraft(resolveDraftValue(entry));
      const payload: EntryBinding = {
        entryId: entry.entryId,
        defaultModelEntryId: entry.defaultModelEntryId,
        defaultModelEntryName: entry.resolvedModel?.name ?? null,
        fallbackModelEntryId: entry.fallbackModelEntryId,
        fallbackModelEntryName: null,
        reasoningEffortOverride: nextOverride,
        statusNote: entry.statusNote ?? "",
      };
      await saveEntryBinding(payload);
      setVersion((current) => current + 1);
      setOverrideDrafts((current) => ({
        ...current,
        [entry.entryId]: nextOverride ?? "",
      }));
      setFeedback(
        nextOverride
          ? `已为 ${entry.entryId} 单独设置推理强度为 ${nextOverride}。以后这个入口会按这档执行。`
          : `已把 ${entry.entryId} 改回跟随模型默认推理强度。`,
      );
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "入口推理强度保存失败。");
    } finally {
      setSavingEntryId(null);
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Entries</span>
          <h1>把 Paperclip 固定上游入口和它们当前解析到的真实模型并排看清楚</h1>
          <p>
            这里的重点不是任务，而是入口。你在 Paperclip 面板里只需要配置一次这里给出的 URL、model 和 token，之后切模型、切密钥、切推理强度都只改 RelayHub。
          </p>
        </div>
      </section>

      {feedback ? <p className="form-success">{feedback}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <Section
        title="Paperclip 入口解析"
        description="这里展示每个 entry-paperclip-* 当前实际会打到哪个真实模型，以及第一次接入 Paperclip 时要填什么。"
      >
        {resolutions.status === "loading" ? (
          <EmptyState title="正在加载入口解析" description="正在读取当前入口绑定和真实模型解析结果。" />
        ) : paperclipEntries.length === 0 ? (
          <EmptyState title="还没有 Paperclip 入口" description="先确认 entry matrix 和 entry binding 是否已经初始化。" />
        ) : (
          <div className="card-grid">
            {paperclipEntries.map((entry) => (
              <article key={entry.entryId} className="data-card">
                <span className="mini-label">{entry.entryId}</span>
                <h3>{entry.alias ?? "未设置 alias"}</h3>
                <p>
                  adapter：{entry.adapterType ?? "无"} / 宿主：{entry.hostType ?? "未知"} / 协议：{entry.protocolFamily ?? "未知"}
                </p>
                <p className="supporting-text">
                  默认绑定：{entry.defaultModelEntryId ?? "尚未绑定"} / 可控：{entry.controllable ? "是" : "否"}
                </p>
                {entry.resolvedModel ? (
                  <>
                    <p>真实模型：{entry.resolvedModel.name} / {entry.resolvedModel.modelId}</p>
                    <p className="supporting-text">Base URL：{entry.resolvedModel.baseUrl}</p>
                    <p className="supporting-text">
                      模型级推理强度：{formatReasoningLabel(entry.resolvedModel.reasoningEffort, "这个模型当前没有默认推理强度")}
                    </p>
                    <p className="supporting-text">
                      入口级覆盖：{entry.reasoningEffortOverride ? `${entry.reasoningEffortOverride}（入口覆盖生效）` : "跟随模型"}
                    </p>
                    <p className="supporting-text">
                      最终生效值：{formatReasoningLabel(entry.effectiveReasoningEffort, "当前没有生效中的推理强度")}
                    </p>
                    <p className="supporting-text">
                      密钥：{entry.resolvedModel.hasStoredApiKey ? "已存" : "缺失"} / 状态：{entry.resolvedModel.status}
                    </p>
                    {entry.controllable ? (
                      <EntryOverrideEditor
                        entry={entry}
                        draftValue={resolveDraftValue(entry)}
                        saving={savingEntryId === entry.entryId}
                        onDraftChange={(value) =>
                          setOverrideDrafts((current) => ({
                            ...current,
                            [entry.entryId]: value,
                          }))
                        }
                        onSave={() => handleOverrideSave(entry)}
                      />
                    ) : null}
                  </>
                ) : (
                  <p className="supporting-text">当前还没有解析到真实模型，先去入口绑定里补默认模型。</p>
                )}
                <TemplateCard entry={entry} />
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title="观测入口" description="观测入口不参与 relay 数据面，也不会生成一次性 Paperclip 接入模板。">
        {observeOnlyEntries.length === 0 ? (
          <EmptyState title="当前没有观测入口" description="如果后续要比较官方入口体验，可以继续用 observe-only 入口并排记录。" />
        ) : (
          <div className="card-grid">
            {observeOnlyEntries.map((entry) => (
              <article key={entry.entryId} className="data-card">
                <span className="mini-label">{entry.entryId}</span>
                <h3>{entry.alias ?? "未设置 alias"}</h3>
                <p className="supporting-text">这是观测入口，只用于记录体验，不参与 RelayHub 数据面与密钥托管。</p>
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function EntryOverrideEditor({
  entry,
  draftValue,
  saving,
  onDraftChange,
  onSave,
}: {
  entry: EntryBindingResolution;
  draftValue: string;
  saving: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <label className="field-label" htmlFor={`reasoning-override-${entry.entryId}`}>
        入口级推理强度覆盖
      </label>
      <select
        id={`reasoning-override-${entry.entryId}`}
        value={draftValue}
        onChange={(event) => onDraftChange(event.target.value)}
        disabled={saving}
      >
        {REASONING_OPTIONS.map((option) => (
          <option key={option.value || "follow-model"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="supporting-text">
        模型级推理强度代表“这个模型默认想多深”；入口级覆盖代表“这个入口单独改，不影响别的入口”。
      </p>
      <div className="inline-actions">
        <button type="button" className="button-link" onClick={onSave} disabled={saving}>
          {saving ? "正在保存..." : "保存入口覆盖"}
        </button>
      </div>
    </div>
  );
}

function TemplateCard({ entry }: { entry: EntryBindingResolution }) {
  return (
    <div className="supporting-text" style={{ marginTop: 12 }}>
      <strong>一次性接入模板</strong>
      <p>URL：`{resolveRelayUrl(entry)}`</p>
      <p>model：`{entry.alias ?? "未设置 alias"}`</p>
      <p>认证：`Authorization: Bearer &lt;{RELAY_TOKEN_NAME}&gt;`</p>
      <p>说明：第一次把 Paperclip 面板改到 RelayHub 后，后续切模型、切密钥、切 `reasoningEffort` 都只在 RelayHub 完成。</p>
    </div>
  );
}

function resolveRelayUrl(entry: EntryBindingResolution) {
  if (entry.protocolFamily === "anthropic-messages") {
    return "https://relayhub.jingshu.cc/claude/v1/messages";
  }
  if (entry.protocolFamily === "openai-responses") {
    return "https://relayhub.jingshu.cc/claude/v1/responses";
  }
  return "https://relayhub.jingshu.cc/claude/v1/chat/completions";
}

function normalizeDraft(value: string): ReasoningEffort | null {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}

function formatReasoningLabel(value: ReasoningEffort | null, fallback: string) {
  if (!value) {
    return fallback;
  }
  if (value === "low") {
    return "low（想得浅）";
  }
  if (value === "medium") {
    return "medium（想得中）";
  }
  return "high（想得深）";
}
