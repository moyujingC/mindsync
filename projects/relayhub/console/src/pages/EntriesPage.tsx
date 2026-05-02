import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { EntryBindingResolution } from "../models/controlPlane";
import { listEntryBindingResolutions } from "../services/controlPlane";

const RELAY_TOKEN_NAME = "RELAYHUB_RELAY_TOKEN";

export function EntriesPage() {
  const resolutions = useAsyncResource(() => listEntryBindingResolutions(), []);
  const paperclipEntries = (resolutions.data ?? []).filter((item) => item.clientFamily === "paperclip");
  const observeOnlyEntries = (resolutions.data ?? []).filter((item) => item.protocolFamily === "observe-only");

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
                      推理强度：{entry.resolvedModel.reasoningEffort ?? "跟随默认"} / 密钥：{entry.resolvedModel.hasStoredApiKey ? "已存" : "缺失"} / 状态：{entry.resolvedModel.status}
                    </p>
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
