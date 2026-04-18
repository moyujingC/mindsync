import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ModelStatusPill } from "../components/ModelStatusPill";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { ModelEntry, ModelEntryInput, ModelEntryKind } from "../models/controlPlane";
import {
  deleteModelEntry,
  listModelEntries,
  saveModelEntry,
  testModelEntryConnection,
} from "../services/controlPlane";

const KIND_OPTIONS: Array<{ value: ModelEntryKind; label: string }> = [
  { value: "coding-plan", label: "Coding Plan" },
  { value: "domestic-model", label: "国产模型" },
  { value: "relay-api", label: "中转 API" },
];

const emptyForm: ModelEntryInput = {
  name: "",
  providerLabel: "",
  kind: "coding-plan",
  baseUrl: "",
  modelId: "",
  purchaseUrl: "",
  apiKey: "",
};

export function ModelLibraryPage() {
  const [version, setVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModelEntryInput>({ ...emptyForm });
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dataResource = useAsyncResource(() => listModelEntries(), [version]);

  const sortedEntries = useMemo(() => {
    if (!dataResource.data) {
      return [];
    }

    return [...dataResource.data].sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  }, [dataResource.data]);

  const presetEntries = useMemo(
    () => sortedEntries.filter((entry) => entry.source === "preset"),
    [sortedEntries],
  );
  const customEntries = useMemo(
    () => sortedEntries.filter((entry) => entry.source === "custom"),
    [sortedEntries],
  );
  const activeEntries = useMemo(
    () => sortedEntries.filter((entry) => entry.status === "active"),
    [sortedEntries],
  );
  const pendingEntries = useMemo(
    () =>
      sortedEntries.filter(
        (entry) => entry.status === "configured-pending-test" || entry.status === "preset-unconfigured",
      ),
    [sortedEntries],
  );

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function openEdit(entry: ModelEntry) {
    setEditingId(entry.id);
    setForm({
      id: entry.id,
      name: entry.name,
      providerLabel: entry.providerLabel,
      kind: entry.kind,
      baseUrl: entry.baseUrl,
      modelId: entry.modelId,
      purchaseUrl: entry.purchaseUrl ?? "",
      apiKey: "",
    });
    setSubmitMessage(null);
    setSubmitError(null);
  }

  function validateForm() {
    const missing: string[] = [];

    if (!form.name.trim()) {
      missing.push("名称");
    }
    if (!form.providerLabel.trim()) {
      missing.push("Provider");
    }
    if (!form.baseUrl.trim()) {
      missing.push("Base URL");
    }
    if (!form.modelId.trim()) {
      missing.push("模型标识");
    }

    return missing;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);

    const missing = validateForm();
    if (missing.length > 0) {
      setSubmitError(`请先补全必填项：${missing.join("、")}。`);
      return;
    }

    try {
      await saveModelEntry({
        ...form,
        id: editingId ?? undefined,
      });
      setVersion((current) => current + 1);
      setSubmitMessage(editingId ? "模型更新已保存。下一步可重新测试连接确认状态。" : "模型已新增。接下来请补 API Key 并测试连接。");
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "模型保存失败。");
    }
  }

  async function handleTest(entry: ModelEntry) {
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      await testModelEntryConnection(entry.id);
      setVersion((current) => current + 1);
      setSubmitMessage(`已完成“${entry.name}”的测试连接，模型状态已刷新。`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "连接测试失败。");
    }
  }

  async function handleDelete(entry: ModelEntry) {
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      await deleteModelEntry(entry.id);
      setVersion((current) => current + 1);
      if (editingId === entry.id) {
        resetForm();
      }
      setSubmitMessage(
        entry.source === "preset"
          ? `已停用“${entry.name}”，需要时可重新配置并测试连接。`
          : `已删除“${entry.name}”自定义模型。`,
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "模型删除失败。");
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Model Library</span>
          <h1>先看哪些模型已经可用，哪些还差最后一步激活</h1>
          <p>
            模型库先回答两件事：哪些条目已经可以绑定任务，哪些条目还需要补配置或补测试连接。先把这里收口，再进入任务绑定和运行记录。
          </p>
        </div>
      </section>

      <Section
        title="模型条目总览"
        description="先分清“已可用”与“待补配置 / 待测试”，避免第一次进入时不知道该从哪一步开始。"
      >
        {dataResource.status === "loading" ? (
          <EmptyState title="正在加载模型库" description="正在读取模型条目和当前激活状态。" />
        ) : null}
        {dataResource.status === "error" ? (
          <EmptyState title="模型库加载失败" description={dataResource.error ?? "请稍后重试。"} />
        ) : null}
        {dataResource.status === "success" ? (
          <div className="card-grid card-grid-3">
            <article className="data-card">
              <span className="mini-label">当前可直接绑定</span>
              <h4>{activeEntries.length} 个模型已可用</h4>
              <p>这些模型已经通过测试连接，可以直接作为任务默认模型。</p>
            </article>
            <article className="data-card">
              <span className="mini-label">还差最后一步</span>
              <h4>{pendingEntries.length} 个模型待补配置</h4>
              <p>优先处理待测试或未配置条目，完成后再进入任务库。</p>
            </article>
            <article className="data-card">
              <span className="mini-label">本轮边界</span>
              <h4>只做手动测试连接</h4>
              <p>不自动检查余额、续费或健康探测，只确认这条接入现在能不能用。</p>
            </article>
          </div>
        ) : null}
      </Section>

      <Section
        title="系统预置"
        description="系统先给出首批精选预置，帮助你少走一次从零填写的路径。"
      >
        {dataResource.status === "success" ? (
          <EntriesTable entries={presetEntries} onEdit={openEdit} onTest={handleTest} onDelete={handleDelete} />
        ) : null}
      </Section>

      <Section
        title="我的模型"
        description="这里放你自己新增或已经激活的模型项，用来承接真实可用的工作入口。"
      >
        {dataResource.status === "success" && customEntries.length === 0 ? (
          <EmptyState title="还没有自定义模型" description="可以先添加你正在使用的中转 API 或自有模型入口。" />
        ) : null}
        {dataResource.status === "success" && customEntries.length > 0 ? (
          <EntriesTable entries={customEntries} onEdit={openEdit} onTest={handleTest} onDelete={handleDelete} />
        ) : null}
      </Section>

      <Section
        title={editingId ? "编辑模式" : "新增模式"}
        description={
          editingId
            ? "当前在编辑已有模型。保存后不会自动激活，仍需要显式测试连接。"
            : "新增后不会自动探测上游，必须显式点击“测试连接”才会变成可用。"
        }
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>名称</span>
            <input
              aria-label="名称"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：PPChat 中转"
            />
          </label>
          <label className="field">
            <span>Provider</span>
            <input
              aria-label="Provider"
              value={form.providerLabel}
              onChange={(event) =>
                setForm((current) => ({ ...current, providerLabel: event.target.value }))
              }
              placeholder="例如：code.ppchat.vip"
            />
          </label>
          <label className="field">
            <span>类型</span>
            <select
              value={form.kind}
              onChange={(event) =>
                setForm((current) => ({ ...current, kind: event.target.value as ModelEntryKind }))
              }
            >
              {KIND_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Base URL</span>
            <input
              aria-label="Base URL"
              value={form.baseUrl}
              onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))}
              placeholder="https://example.com/v1"
            />
          </label>
          <label className="field">
            <span>模型标识</span>
            <input
              aria-label="模型标识"
              value={form.modelId}
              onChange={(event) => setForm((current) => ({ ...current, modelId: event.target.value }))}
              placeholder="gpt-5 / deepseek-chat / qwen-max"
            />
          </label>
          <label className="field">
            <span>充值或购买链接</span>
            <input
              value={form.purchaseUrl ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, purchaseUrl: event.target.value }))
              }
              placeholder="可选"
            />
          </label>
          <label className="field field-wide">
            <span>API Key</span>
            <input
              value={form.apiKey ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
              placeholder={editingId ? "留空则保留原有密钥" : "保存后由服务端脱敏存储"}
            />
          </label>
          <div className="form-actions field-wide">
            <button type="submit" className="button-link">
              {editingId ? "保存更新" : "新增模型"}
            </button>
            <button type="button" className="button-link secondary" onClick={resetForm}>
              清空表单
            </button>
            {submitMessage ? <span className="supporting-text feedback-inline">{submitMessage}</span> : null}
            {submitError ? <span className="error-inline">{submitError}</span> : null}
          </div>
        </form>
      </Section>
    </div>
  );
}

function EntriesTable({
  entries,
  onEdit,
  onTest,
  onDelete,
}: {
  entries: ModelEntry[];
  onEdit: (entry: ModelEntry) => void;
  onTest: (entry: ModelEntry) => void;
  onDelete: (entry: ModelEntry) => void;
}) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>类型</th>
            <th>Provider</th>
            <th>模型标识</th>
            <th>状态</th>
            <th>密钥</th>
            <th>最近测试</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>
                <strong>{entry.name}</strong>
                <div className="supporting-text">{entry.statusNote}</div>
              </td>
              <td>{KIND_OPTIONS.find((item) => item.value === entry.kind)?.label ?? entry.kind}</td>
              <td>{entry.providerLabel}</td>
              <td>{entry.modelId}</td>
              <td>
                <ModelStatusPill status={entry.status} />
              </td>
              <td>{entry.maskedApiKey ?? "未保存"}</td>
              <td>{entry.lastTestedAt ?? "尚未测试"}</td>
              <td>
                <div className="inline-actions">
                  <button type="button" className="action-button" onClick={() => onEdit(entry)}>
                    编辑
                  </button>
                  <button type="button" className="action-button" onClick={() => onTest(entry)}>
                    测试连接
                  </button>
                  <button
                    type="button"
                    className="action-button danger"
                    onClick={() => onDelete(entry)}
                  >
                    {entry.source === "preset" ? "停用" : "删除"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
