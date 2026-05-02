"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createModelEntry,
  deleteModelEntry,
  getModelCatalog,
  listModelEntries,
  patchModelEntry,
  testModelEntry,
} from "@/lib/api";
import type { ModelCatalogResponse, ModelEntry } from "@/lib/schemas";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { KeyValueList } from "@/components/ui/key-value-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { StateCard } from "@/components/ui/state-card";
import { SummaryCard } from "@/components/ui/summary-card";
import { Textarea } from "@/components/ui/textarea";

const emptyForm = {
  name: "",
  providerLabel: "",
  kind: "coding-plan",
  baseUrl: "",
  modelId: "",
  reasoningEffort: "",
  purchaseUrl: "",
  apiKey: "",
};

export function ModelsView() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catalogResult, setCatalogResult] = useState<ModelCatalogResponse | null>(null);
  const [catalogTargetName, setCatalogTargetName] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["models"],
    queryFn: listModelEntries,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        providerLabel: form.providerLabel.trim(),
        kind: form.kind,
        baseUrl: form.baseUrl.trim(),
        modelId: form.modelId.trim(),
        reasoningEffort: normalizeReasoning(form.reasoningEffort),
        purchaseUrl: form.purchaseUrl.trim() || null,
        apiKey: form.apiKey.trim() || undefined,
      };
      if (editingId) {
        return patchModelEntry(editingId, payload);
      }
      return createModelEntry(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setFeedback(editingId ? "模型配置已保存。" : "模型已新建。");
      setError(null);
      setEditingId(null);
      setForm(emptyForm);
      setCatalogResult(null);
      setCatalogTargetName(null);
    },
    onError: (currentError) => {
      setError(currentError instanceof Error ? currentError.message : "模型保存失败。");
      setFeedback(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => testModelEntry(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setFeedback(result.status === "active" ? `测试通过：${result.name} 已可用。` : `测试完成：${result.statusNote}`);
      setError(null);
    },
    onError: (currentError) => {
      setError(currentError instanceof Error ? currentError.message : "测试连接失败。");
      setFeedback(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteModelEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setFeedback("模型已删除。");
      setError(null);
      if (editingId) {
        setEditingId(null);
        setForm(emptyForm);
      }
    },
    onError: (currentError) => {
      setError(currentError instanceof Error ? currentError.message : "删除模型失败。");
      setFeedback(null);
    },
  });

  const catalogMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => getModelCatalog(id).then((result) => ({ result, name })),
    onSuccess: ({ result, name }) => {
      if (result.items[0]) {
        setForm((current) => ({
          ...current,
          modelId: current.modelId || result.items[0]!.id,
        }));
      }
      setCatalogResult(result);
      setCatalogTargetName(name);
      setError(null);
      setFeedback(`已拉取 ${name} 的上游模型目录。`);
    },
    onError: (currentError) => {
      setError(currentError instanceof Error ? currentError.message : "获取上游模型列表失败。");
      setCatalogResult(null);
      setCatalogTargetName(null);
    },
  });

  const entries = query.data ?? [];
  const presetEntries = entries.filter((entry) => entry.source === "preset");
  const customEntries = entries.filter((entry) => entry.source === "custom");
  const activeCount = entries.filter((entry) => entry.status === "active").length;
  const keyMissingCount = entries.filter((entry) => !entry.hasStoredApiKey).length;
  const relayCount = entries.filter((entry) => entry.kind === "relay-api").length;

  if (query.isLoading) {
    return <StateCard title="正在加载模型库" description="正在读取当前模型条目、密钥状态和测试结果。" />;
  }

  if (query.isError) {
    return <StateCard title="模型库加载失败" description={query.error instanceof Error ? query.error.message : "暂时无法读取模型库。"} />;
  }

  return (
    <div className="space-y-6">
      {feedback ? <AlertBanner tone="success">{feedback}</AlertBanner> : null}
      {error ? <AlertBanner tone="danger">{error}</AlertBanner> : null}

      <section className="grid gap-4 xl:grid-cols-4">
        <SummaryCard label="模型总数" value={entries.length} hint="当前这套控制台里已经登记的全部模型条目。" />
        <SummaryCard label="测试通过" value={activeCount} hint="这些模型已经通过手动测试，可继续分配给入口。" tone="success" />
        <SummaryCard label="缺少密钥" value={keyMissingCount} hint="这些模型还没存厂商 API Key（厂商密钥），现在不能真正调用。" tone={keyMissingCount > 0 ? "warning" : "neutral"} />
        <SummaryCard label="中转入口" value={relayCount} hint="这些条目通常支持拉上游模型目录，再决定 modelId。" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_460px]">
        <div className="space-y-6">
          <ModelGroup
            title="预置模型"
            description="这些条目是 RelayHub 预先收好的常用候选。通常只维护密钥、可测试性和 modelId，不建议随意改它们的基础身份。"
            entries={presetEntries}
            onEdit={(entry) => openEdit(entry, setEditingId, setForm, setCatalogResult, setCatalogTargetName)}
            onTest={(id) => testMutation.mutate(id)}
            onCatalog={(entry) => catalogMutation.mutate({ id: entry.id, name: entry.name })}
            testingId={(testMutation.variables as string | undefined) ?? null}
            catalogId={(catalogMutation.variables as { id: string; name: string } | undefined)?.id ?? null}
          />
          <ModelGroup
            title="自定义模型"
            description="这里用于新增你自己想接入的模型或中转。身份清楚、接入清楚、测试通过之后，再回入口页绑定。"
            entries={customEntries}
            onEdit={(entry) => openEdit(entry, setEditingId, setForm, setCatalogResult, setCatalogTargetName)}
            onTest={(id) => testMutation.mutate(id)}
            onCatalog={(entry) => catalogMutation.mutate({ id: entry.id, name: entry.name })}
            onDelete={(id) => deleteMutation.mutate(id)}
            testingId={(testMutation.variables as string | undefined) ?? null}
            deletingId={(deleteMutation.variables as string | undefined) ?? null}
            catalogId={(catalogMutation.variables as { id: string; name: string } | undefined)?.id ?? null}
          />
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 sm:p-6" data-testid="models-editor-panel">
          <SectionHeading
            eyebrow={editingId ? "编辑态" : "新增态"}
            title={editingId ? "编辑模型条目" : "新增模型条目"}
            description={
              editingId
                ? "这里改的是这条模型的长期配置。入口页再决定谁来用它。"
                : "先把真实上游定义清楚：它是谁、怎么接、默认有什么运行行为。"
            }
          />

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <SectionHeading
                title="身份区"
                description="先定义这条模型是谁。这里讲的是模型身份，不是调用时的临时覆盖。"
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="名称" description="给这条模型的人类可读名字。">
                  <Input aria-label="模型名称" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </Field>
                <Field label="Provider" description="上游提供方。比如 OpenAI、DeepSeek、某个中转站。">
                  <Input
                    aria-label="Provider 上游提供方"
                    value={form.providerLabel}
                    onChange={(event) => setForm((current) => ({ ...current, providerLabel: event.target.value }))}
                  />
                </Field>
                <Field label="类型" description="说明这是 coding plan、国产模型，还是中转 API。">
                  <Select aria-label="模型类型" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}>
                    <option value="coding-plan">Coding Plan（编码规划）</option>
                    <option value="domestic-model">国产模型</option>
                    <option value="relay-api">中转 API</option>
                  </Select>
                </Field>
                <Field
                  label="来源说明"
                  description="预置模型的身份通常视为固定；自定义模型则是你自己维护的额外条目。"
                >
                  <div className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {editingId ? "当前正在编辑已有条目。预置条目的基础身份通常不建议随意更改。" : "当前是新增态，将创建一条新的自定义模型。"}
                  </div>
                </Field>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <SectionHeading
                title="接入区"
                description="这里定义真实上游如何接入。Base URL（接口根地址）、modelId（真实模型名）和 API Key（厂商密钥）都属于这一层。"
              />
              <div className="mt-4 grid gap-4">
                <Field
                  label="Base URL"
                  description="接口根地址。RelayHub 以后会从这里真正发请求。"
                >
                  <Input aria-label="Base URL" value={form.baseUrl} onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))} />
                </Field>
                <Field
                  label="modelId"
                  description="真实模型名。不是页面上的别名，而是上游实际识别的模型标识。"
                >
                  <Input aria-label="modelId" value={form.modelId} onChange={(event) => setForm((current) => ({ ...current, modelId: event.target.value }))} />
                </Field>
                <Field
                  label="购买或管理地址"
                  description="方便你跳回上游面板续费、看配额或管理账户。"
                >
                  <Input
                    aria-label="购买或管理地址"
                    value={form.purchaseUrl}
                    onChange={(event) => setForm((current) => ({ ...current, purchaseUrl: event.target.value }))}
                  />
                </Field>
                <Field
                  label="API Key"
                  description="厂商密钥。这里只存真实上游厂商的密钥，不是 RelayHub 自己的门禁 token。"
                  hint="编辑已有模型时，留空表示不改现有密钥。"
                >
                  <Textarea aria-label="API Key" value={form.apiKey} onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))} />
                </Field>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <SectionHeading
                title="行为区"
                description="这里定义默认行为：reasoning effort（推理强度 / 思考深浅）、上游模型目录拉取，以及最近一次测试结果。"
              />
              <div className="mt-4 grid gap-4">
                <Field
                  label="推理强度"
                  description="如果留空，说明这个模型本身没有默认推理强度，入口页可以继续单独覆盖。"
                >
                  <Select
                    aria-label="推理强度"
                    value={form.reasoningEffort}
                    onChange={(event) => setForm((current) => ({ ...current, reasoningEffort: event.target.value }))}
                  >
                    <option value="">跟随默认</option>
                    <option value="low">low（想得浅）</option>
                    <option value="medium">medium（想得中）</option>
                    <option value="high">high（想得深）</option>
                  </Select>
                </Field>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">上游模型目录</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        只有部分 relay-api（中转 API）条目适合直接拉取上游 `/models` 列表。
                      </p>
                    </div>
                    {editingId ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={catalogMutation.isPending}
                        onClick={() => {
                          const currentEntry = entries.find((entry) => entry.id === editingId);
                          if (!currentEntry) return;
                          catalogMutation.mutate({ id: currentEntry.id, name: currentEntry.name });
                        }}
                      >
                        {catalogMutation.isPending ? "获取中..." : "获取模型列表"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    {catalogResult ? (
                      <div className="rounded-3xl border border-sky-200 bg-sky-50/80 p-4" data-testid="model-catalog-panel">
                        <p className="text-sm font-semibold text-sky-950">{catalogTargetName ?? "当前条目"} 的上游目录</p>
                        <p className="mt-2 text-sm leading-6 text-sky-900/80">
                          已拉到 {catalogResult.items.length} 个候选。当前表单中的 modelId 会优先回填为第一个可用项，你也可以手动再改。
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {catalogResult.items.slice(0, 8).map((item) => (
                            <Badge key={item.id}>{item.id}</Badge>
                          ))}
                        </div>
                        <p className="mt-3 text-xs leading-5 text-sky-900/70">当前表单 modelId：{form.modelId || "尚未回填"}</p>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                        还没有拉取过上游模型目录。适合在已经填好 Base URL 和 API Key 后再执行。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saveMutation.isPending} data-testid="save-model-button">
                {saveMutation.isPending ? "正在保存..." : editingId ? "保存模型" : "新增模型"}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setCatalogResult(null);
                    setCatalogTargetName(null);
                  }}
                >
                  取消编辑
                </Button>
              ) : null}
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}

function ModelGroup({
  title,
  description,
  entries,
  onEdit,
  onTest,
  onCatalog,
  onDelete,
  testingId,
  deletingId,
  catalogId,
}: {
  title: string;
  description: string;
  entries: ModelEntry[];
  onEdit: (entry: ModelEntry) => void;
  onTest: (id: string) => void;
  onCatalog: (entry: ModelEntry) => void;
  onDelete?: (id: string) => void;
  testingId: string | null;
  deletingId?: string | null;
  catalogId: string | null;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
      <SectionHeading title={title} description={description} />
      <div className="mt-5 space-y-4">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
            data-testid={`model-card-${entry.id}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={entry.source === "preset" ? "accent" : "neutral"}>{entry.source === "preset" ? "预置" : "自定义"}</Badge>
                  <Badge>{humanizeKind(entry.kind)}</Badge>
                  <Badge tone={entry.status === "active" ? "success" : entry.status === "test-failed" ? "danger" : "warning"}>
                    {humanizeStatus(entry.status)}
                  </Badge>
                  <Badge tone={entry.hasStoredApiKey ? "success" : "warning"}>{entry.hasStoredApiKey ? "密钥已存" : "缺密钥"}</Badge>
                </div>
                <h4 className="mt-4 text-lg font-semibold text-slate-950">{entry.name}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Provider（上游提供方）：{entry.providerLabel}。{entry.source === "preset" ? "这是预置身份条目，优先改接入配置和测试状态。" : "这是你自己维护的自定义条目。"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <KeyValueList
                dense
                items={[
                  { label: "Base URL", value: <span className="break-all font-mono text-xs text-slate-900">{entry.baseUrl}</span> },
                  { label: "modelId", value: <span className="font-mono text-xs text-slate-900">{entry.modelId}</span> },
                  { label: "推理强度", value: entry.reasoningEffort ? `${entry.reasoningEffort}（有默认值）` : "无默认值" },
                  { label: "上次测试", value: entry.lastTestedAt ?? "还没有测试过" },
                  { label: "状态说明", value: entry.statusNote || "暂无补充说明" },
                  { label: "能力探测", value: summarizeCapabilities(entry) },
                ]}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => onEdit(entry)}>
                编辑
              </Button>
              <Button variant="secondary" onClick={() => onTest(entry.id)} disabled={testingId === entry.id}>
                {testingId === entry.id ? "测试中..." : "测试连接"}
              </Button>
              {entry.kind === "relay-api" ? (
                <Button variant="ghost" onClick={() => onCatalog(entry)} disabled={catalogId === entry.id}>
                  {catalogId === entry.id ? "获取中..." : "获取模型列表"}
                </Button>
              ) : null}
              {onDelete && entry.source === "custom" ? (
                <Button variant="danger" onClick={() => onDelete(entry.id)} disabled={deletingId === entry.id}>
                  {deletingId === entry.id ? "删除中..." : "删除"}
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function openEdit(
  entry: ModelEntry,
  setEditingId: (value: string) => void,
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>,
  setCatalogResult: (value: ModelCatalogResponse | null) => void,
  setCatalogTargetName: (value: string | null) => void,
) {
  setEditingId(entry.id);
  setCatalogResult(null);
  setCatalogTargetName(null);
  setForm({
    name: entry.name,
    providerLabel: entry.providerLabel,
    kind: entry.kind,
    baseUrl: entry.baseUrl,
    modelId: entry.modelId,
    reasoningEffort: entry.reasoningEffort ?? "",
    purchaseUrl: entry.purchaseUrl ?? "",
    apiKey: "",
  });
}

function normalizeReasoning(value: string) {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}

function humanizeStatus(value: ModelEntry["status"]) {
  if (value === "preset-unconfigured") return "预置未激活";
  if (value === "configured-pending-test") return "已配置待测试";
  if (value === "active") return "测试通过可用";
  if (value === "test-failed") return "测试失败";
  return "已停用";
}

function humanizeKind(value: ModelEntry["kind"]) {
  if (value === "coding-plan") return "Coding Plan";
  if (value === "domestic-model") return "国产模型";
  return "中转 API";
}

function summarizeCapabilities(entry: ModelEntry) {
  const parts = [
    entry.capabilities.responses.ok ? "responses 可用" : "responses 不可用",
    entry.capabilities.responses.streamOk ? "stream 可用" : "stream 不可用",
    entry.capabilities.chatCompletions.ok ? "chat 可用" : "chat 不可用",
  ];
  return parts.join(" / ");
}
