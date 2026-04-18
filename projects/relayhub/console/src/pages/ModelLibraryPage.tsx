import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ModelStatusPill } from "../components/ModelStatusPill";
import { Section } from "../components/Section";
import { useAsyncResource } from "../hooks/useAsyncResource";
import type { ModelEntryInput, ModelEntryKind } from "../models/controlPlane";
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
  const entries = useAsyncResource(() => listModelEntries(), []);
  const [version, setVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModelEntryInput>(emptyForm);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dataResource = useAsyncResource(() => listModelEntries(), [version]);

  const sortedEntries = useMemo(() => {
    if (!dataResource.data) {
      return [];
    }

    return [...dataResource.data].sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  }, [dataResource.data]);

  useEffect(() => {
    if (entries.status === "success" && !editingId && form === emptyForm) {
      return;
    }
  }, [editingId, entries.status, form]);

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      await saveModelEntry({
        ...form,
        id: editingId ?? undefined,
      });
      setVersion((current) => current + 1);
      setSubmitMessage(editingId ? "模型配置已更新。" : "模型配置已新增。");
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "模型保存失败。");
    }
  }

  async function handleTest(id: string) {
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      await testModelEntryConnection(id);
      setVersion((current) => current + 1);
      setSubmitMessage("连接测试已完成，状态已刷新。");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "连接测试失败。");
    }
  }

  async function handleDelete(id: string) {
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      await deleteModelEntry(id);
      setVersion((current) => current + 1);
      if (editingId === id) {
        resetForm();
      }
      setSubmitMessage("模型条目已处理。预置条目会转为停用，自定义条目会直接移除。");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "模型删除失败。");
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Model Library</span>
          <h1>先把模型资产收进来，再谈任务选型和治理判断</h1>
          <p>
            当前主路径先解决“添加模型并激活”。预置 coding plan 和国产模型先进入模型库，补 API Key 后再手动测试连接。
          </p>
        </div>
      </section>

      <Section
        title="模型条目"
        description="系统预置和自定义模型统一收在这里，状态以可用性为准，不做自动续费或余额判断。"
      >
        {dataResource.status === "loading" ? (
          <EmptyState title="正在加载模型库" description="正在读取模型条目和激活状态。" />
        ) : null}
        {dataResource.status === "error" ? (
          <EmptyState title="模型库加载失败" description={dataResource.error ?? "请稍后重试。"} />
        ) : null}
        {dataResource.status === "success" ? (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>来源</th>
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
                {sortedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.name}</strong>
                      <div className="supporting-text">{entry.statusNote}</div>
                    </td>
                    <td>{entry.source === "preset" ? "系统预置" : "自定义"}</td>
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
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => {
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
                          }}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => handleTest(entry.id)}
                        >
                          测试连接
                        </button>
                        <button
                          type="button"
                          className="action-button danger"
                          onClick={() => handleDelete(entry.id)}
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
        ) : null}
      </Section>

      <Section
        title={editingId ? "编辑模型条目" : "新增模型条目"}
        description="保存后不会自动探测上游，必须显式点击“测试连接”才会变成可用。"
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>名称</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：PPChat 中转"
            />
          </label>
          <label className="field">
            <span>Provider</span>
            <input
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
              value={form.baseUrl}
              onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))}
              placeholder="https://example.com/v1"
            />
          </label>
          <label className="field">
            <span>模型标识</span>
            <input
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
            {submitMessage ? <span className="supporting-text">{submitMessage}</span> : null}
            {submitError ? <span className="error-inline">{submitError}</span> : null}
          </div>
        </form>
      </Section>
    </div>
  );
}
