"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listEntryBindingResolutions, patchEntryBinding } from "@/lib/api";
import type { EntryBindingResolution } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { StateCard } from "@/components/ui/state-card";

const RELAY_TOKEN_NAME = "RELAYHUB_RELAY_TOKEN";

export function EntriesView() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const query = useQuery({
    queryKey: ["entry-binding-resolutions"],
    queryFn: listEntryBindingResolutions,
  });

  const mutation = useMutation({
    mutationFn: async (entry: EntryBindingResolution) =>
      patchEntryBinding(entry.entryId, {
        defaultModelEntryId: entry.defaultModelEntryId,
        fallbackModelEntryId: entry.fallbackModelEntryId,
        reasoningEffortOverride: normalizeDraft(drafts[entry.entryId] ?? entry.reasoningEffortOverride ?? ""),
        statusNote: entry.statusNote ?? "",
      }),
    onSuccess: (_result, entry) => {
      queryClient.invalidateQueries({ queryKey: ["entry-binding-resolutions"] });
      const next = normalizeDraft(drafts[entry.entryId] ?? entry.reasoningEffortOverride ?? "");
      setFeedback(next ? `已为 ${entry.entryId} 单独设置推理强度为 ${next}。` : `已把 ${entry.entryId} 改回跟随模型。`);
      setError(null);
    },
    onError: (currentError) => {
      setError(currentError instanceof Error ? currentError.message : "保存入口覆盖失败。");
      setFeedback(null);
    },
  });

  if (query.isLoading) {
    return <StateCard title="正在加载入口解析" description="正在读取每个入口当前实际会打到哪个真实模型。" />;
  }

  if (query.isError) {
    return <StateCard title="入口加载失败" description={query.error instanceof Error ? query.error.message : "暂时无法读取入口解析结果。"} />;
  }

  const items = query.data ?? [];
  const activeEntries = items.filter((item) => item.protocolFamily !== "observe-only");
  const observeEntries = items.filter((item) => item.protocolFamily === "observe-only");

  return (
    <div className="space-y-6">
      {feedback ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {activeEntries.map((entry) => (
          <article key={entry.entryId} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{entry.entryId}</Badge>
              <Badge tone={entry.controllable ? "success" : "warning"}>{entry.controllable ? "可控" : "只观测"}</Badge>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{entry.alias ?? "未设置 alias"}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              client：{entry.clientFamily ?? "无"} / adapter：{entry.adapterType ?? "无"} / host：{entry.hostType ?? "未知"} / protocol：{entry.protocolFamily ?? "未知"}
            </p>

            {entry.resolvedModel ? (
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <p>当前绑定模型：<span className="font-medium text-slate-950">{entry.resolvedModel.name}</span></p>
                <p>真实 modelId：<span className="font-mono text-xs">{entry.resolvedModel.modelId}</span></p>
                <p className="break-all">Base URL：<span className="font-mono text-xs">{entry.resolvedModel.baseUrl}</span></p>
                <p>模型级推理强度：{formatReasoning(entry.resolvedModel.reasoningEffort, "没有默认值")}</p>
                <p>入口级覆盖：{entry.reasoningEffortOverride ? `${entry.reasoningEffortOverride}（入口覆盖生效）` : "跟随模型"}</p>
                <p>最终生效值：{formatReasoning(entry.effectiveReasoningEffort, "当前没有生效值")}</p>
                <p>密钥状态：{entry.resolvedModel.hasStoredApiKey ? "已存" : "缺失"} / 模型状态：{entry.resolvedModel.status}</p>
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-slate-600">当前还没有解析到真实模型，先去模型库补齐并绑定。</p>
            )}

            {entry.controllable ? (
              <div className="mt-5 space-y-3">
                <Field label="入口级推理强度覆盖" hint="这个入口单独改，不影响别的入口。">
                  <Select
                    value={drafts[entry.entryId] ?? entry.reasoningEffortOverride ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [entry.entryId]: event.target.value,
                      }))
                    }
                  >
                    <option value="">跟随模型</option>
                    <option value="low">low（想得浅）</option>
                    <option value="medium">medium（想得中）</option>
                    <option value="high">high（想得深）</option>
                  </Select>
                </Field>
                <Button onClick={() => mutation.mutate(entry)} disabled={mutation.isPending}>
                  {mutation.isPending ? "正在保存..." : "保存入口覆盖"}
                </Button>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">一次性接入模板</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>URL：<span className="font-mono text-xs text-slate-900">{resolveRelayUrl(entry)}</span></p>
                <p>model：<span className="font-mono text-xs text-slate-900">{entry.alias ?? "未设置 alias"}</span></p>
                <p>认证：<span className="font-mono text-xs text-slate-900">Authorization: Bearer &lt;{RELAY_TOKEN_NAME}&gt;</span></p>
                <p>以后切模型、切密钥、切推理强度，都只改 RelayHub，不改 Paperclip 面板。</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {observeEntries.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-950">观测入口</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">这些入口只做记录和比较，不进入 RelayHub 数据面。</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {observeEntries.map((entry) => (
              <div key={entry.entryId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">{entry.alias ?? entry.entryId}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.entryId}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function normalizeDraft(value: string) {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}

function formatReasoning(value: string | null, fallback: string) {
  if (!value) return fallback;
  if (value === "low") return "low（想得浅）";
  if (value === "medium") return "medium（想得中）";
  return "high（想得深）";
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
