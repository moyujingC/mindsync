"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createModelEntry,
  deleteModelEntry,
  getModelCatalog,
  listModelEntries,
  patchModelEntry,
  testModelEntry,
} from "@/lib/api";
import type { ModelEntry } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateCard } from "@/components/ui/state-card";
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
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);

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
      setCatalogMessage(null);
      setEditingId(null);
      setForm(emptyForm);
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
    mutationFn: (id: string) => getModelCatalog(id),
    onSuccess: (result) => {
      if (result.items[0]) {
        setForm((current) => ({
          ...current,
          modelId: current.modelId || result.items[0]!.id,
        }));
      }
      setCatalogMessage(`已获取 ${result.items.length} 个上游可用模型，可以继续切换 modelId。`);
      setError(null);
    },
    onError: (currentError) => {
      setError(currentError instanceof Error ? currentError.message : "获取上游模型列表失败。");
      setCatalogMessage(null);
    },
  });

  if (query.isLoading) {
    return <StateCard title="正在加载模型库" description="正在读取当前模型条目和测试状态。" />;
  }

  if (query.isError) {
    return <StateCard title="模型库加载失败" description={query.error instanceof Error ? query.error.message : "暂时无法读取模型库。"} />;
  }

  const entries = query.data ?? [];
  const presetEntries = useMemo(() => entries.filter((entry) => entry.source === "preset"), [entries]);
  const customEntries = useMemo(() => entries.filter((entry) => entry.source === "custom"), [entries]);

  return (
    <div className="space-y-6">
      {feedback ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {catalogMessage ? <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">{catalogMessage}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px]">
        <div className="space-y-6">
          <ModelGroup
            title="预置模型"
            description="这些条目是 RelayHub 自带的常用模型候选。你通常改的是密钥、modelId 或测试状态，不建议随意改它们的身份。"
            entries={presetEntries}
            onEdit={(entry) => openEdit(entry, setEditingId, setForm)}
            onTest={(id) => testMutation.mutate(id)}
            onCatalog={(id) => catalogMutation.mutate(id)}
            testingId={(testMutation.variables as string | undefined) ?? null}
            catalogId={(catalogMutation.variables as string | undefined) ?? null}
          />
          <ModelGroup
            title="自定义模型"
            description="这里放你自己额外接入的模型或中转。"
            entries={customEntries}
            onEdit={(entry) => openEdit(entry, setEditingId, setForm)}
            onTest={(id) => testMutation.mutate(id)}
            onCatalog={(id) => catalogMutation.mutate(id)}
            onDelete={(id) => deleteMutation.mutate(id)}
            testingId={(testMutation.variables as string | undefined) ?? null}
            deletingId={(deleteMutation.variables as string | undefined) ?? null}
            catalogId={(catalogMutation.variables as string | undefined) ?? null}
          />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
          <h3 className="text-lg font-semibold text-slate-950">{editingId ? "编辑模型" : "新增模型"}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            模型库负责定义真实上游：地址、模型名、推理强度和密钥状态。入口页再决定谁用哪个模型。
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <Field label="名称">
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <Field label="Provider">
              <Input value={form.providerLabel} onChange={(event) => setForm((current) => ({ ...current, providerLabel: event.target.value }))} />
            </Field>
            <Field label="类型">
              <Select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}>
                <option value="coding-plan">Coding Plan</option>
                <option value="domestic-model">国产模型</option>
                <option value="relay-api">中转 API</option>
              </Select>
            </Field>
            <Field label="Base URL">
              <Input value={form.baseUrl} onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))} />
            </Field>
            <Field label="modelId">
              <Input value={form.modelId} onChange={(event) => setForm((current) => ({ ...current, modelId: event.target.value }))} />
            </Field>
            <Field label="推理强度" hint="如果留空，就表示这个模型自己没有默认推理强度。">
              <Select value={form.reasoningEffort} onChange={(event) => setForm((current) => ({ ...current, reasoningEffort: event.target.value }))}>
                <option value="">跟随默认</option>
                <option value="low">low（想得浅）</option>
                <option value="medium">medium（想得中）</option>
                <option value="high">high（想得深）</option>
              </Select>
            </Field>
            <Field label="购买或管理地址">
              <Input value={form.purchaseUrl} onChange={(event) => setForm((current) => ({ ...current, purchaseUrl: event.target.value }))} />
            </Field>
            <Field label="API Key" hint="这里只存真实上游厂商的密钥。它不是 RelayHub 门禁 token。">
              <Textarea value={form.apiKey} onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))} />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "正在保存..." : editingId ? "保存模型" : "新增模型"}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setCatalogMessage(null);
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
  onCatalog: (id: string) => void;
  onDelete?: (id: string) => void;
  testingId: string | null;
  deletingId?: string | null;
  catalogId: string | null;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 space-y-4">
        {entries.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{entry.name}</Badge>
              <Badge tone={entry.status === "active" ? "success" : entry.status === "test-failed" ? "danger" : "warning"}>
                {entry.status}
              </Badge>
              <Badge tone={entry.hasStoredApiKey ? "success" : "warning"}>{entry.hasStoredApiKey ? "密钥已存" : "缺密钥"}</Badge>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>Provider：{entry.providerLabel}</p>
              <p>Base URL：<span className="break-all font-mono text-xs">{entry.baseUrl}</span></p>
              <p>modelId：<span className="font-mono text-xs">{entry.modelId}</span></p>
              <p>推理强度：{entry.reasoningEffort ?? "无默认值"}</p>
              <p>状态说明：{entry.statusNote}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => onEdit(entry)}>编辑</Button>
              <Button variant="secondary" onClick={() => onTest(entry.id)} disabled={testingId === entry.id}>
                {testingId === entry.id ? "测试中..." : "测试连接"}
              </Button>
              {entry.kind === "relay-api" ? (
                <Button variant="ghost" onClick={() => onCatalog(entry.id)} disabled={catalogId === entry.id}>
                  {catalogId === entry.id ? "获取中..." : "获取模型列表"}
                </Button>
              ) : null}
              {onDelete && entry.source === "custom" ? (
                <Button variant="ghost" onClick={() => onDelete(entry.id)} disabled={deletingId === entry.id}>
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
) {
  setEditingId(entry.id);
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
