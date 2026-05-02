"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listEntryBindingResolutions, patchEntryBinding } from "@/lib/api";
import type { EntryBindingResolution } from "@/lib/schemas";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { KeyValueList } from "@/components/ui/key-value-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { StateCard } from "@/components/ui/state-card";
import { SummaryCard } from "@/components/ui/summary-card";

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
    return <StateCard title="正在加载入口工作台" description="正在读取每个入口的真实绑定、覆盖规则和接入模板。" />;
  }

  if (query.isError) {
    return <StateCard title="入口工作台加载失败" description={query.error instanceof Error ? query.error.message : "暂时无法读取入口解析结果。"} />;
  }

  const items = query.data ?? [];
  const activeEntries = items.filter((item) => item.protocolFamily !== "observe-only");
  const observeEntries = items.filter((item) => item.protocolFamily === "observe-only");
  const resolvedCount = activeEntries.filter((item) => item.resolvedModel).length;
  const riskCount = activeEntries.filter((item) => !item.resolvedModel || !item.resolvedModel.hasStoredApiKey).length;
  const controllableCount = activeEntries.filter((item) => item.controllable).length;

  return (
    <div className="space-y-6">
      {feedback ? <AlertBanner tone="success">{feedback}</AlertBanner> : null}
      {error ? <AlertBanner tone="danger">{error}</AlertBanner> : null}

      <section className="grid gap-4 xl:grid-cols-4">
        <SummaryCard label="可控入口" value={controllableCount} hint="这些入口可以直接在 RelayHub 里切默认模型或推理强度。" tone="success" />
        <SummaryCard label="只观测入口" value={observeEntries.length} hint="这些入口只记录行为，不进入 RelayHub 数据面。" />
        <SummaryCard label="已解析模型" value={resolvedCount} hint="说明已经知道这个入口最终会打到哪个真实模型。" />
        <SummaryCard label="风险入口" value={riskCount} hint="包括还没绑定到模型，或模型缺少厂商密钥的入口。" tone={riskCount > 0 ? "warning" : "neutral"} />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
        <SectionHeading
          eyebrow="主工作台"
          title="入口矩阵"
          description="先看入口，再看模型。这里直接回答：哪个 IDE、哪个 adapter（接入适配器）、哪个协议端点，现在实际会打到哪个真实模型。"
          action={
            <Badge tone="accent" data-testid="entries-matrix-badge">
              {activeEntries.length} 个主入口
            </Badge>
          }
        />

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {activeEntries.map((entry) => {
            const currentDraft = drafts[entry.entryId] ?? entry.reasoningEffortOverride ?? "";
            const pending = mutation.isPending && mutation.variables?.entryId === entry.entryId;
            const hasRisk = !entry.resolvedModel || !entry.resolvedModel.hasStoredApiKey;

            return (
              <article
                key={entry.entryId}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                data-testid={`entry-card-${entry.entryId}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{entry.alias ?? "未设置 alias"}</Badge>
                      <Badge>{entry.entryId}</Badge>
                      <Badge tone={entry.controllable ? "success" : "warning"}>{entry.controllable ? "可控入口" : "只读入口"}</Badge>
                      {hasRisk ? <Badge tone="warning">需要处理</Badge> : <Badge tone="success">可继续使用</Badge>}
                    </div>
                    <h4 className="mt-4 text-lg font-semibold text-slate-950">{humanizeClient(entry.clientFamily)} / {humanizeHost(entry.hostType)}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      这是一个 {humanizeProtocol(entry.protocolFamily)} 入口。你以后切模型，优先在这里确认谁在用、实际用到哪、是否需要单独覆盖推理强度。
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge>{humanizeClient(entry.clientFamily)}</Badge>
                  <Badge>{humanizeAdapter(entry.adapterType)}</Badge>
                  <Badge>{humanizeHost(entry.hostType)}</Badge>
                  <Badge>{humanizeProtocol(entry.protocolFamily)}</Badge>
                </div>

                <div className="mt-5">
                  {entry.resolvedModel ? (
                    <KeyValueList
                      items={[
                        {
                          label: "当前绑定模型",
                          value: <span className="font-medium text-slate-950">{entry.resolvedModel.name}</span>,
                          emphasize: true,
                        },
                        {
                          label: "真实 modelId",
                          value: <span className="font-mono text-xs text-slate-900">{entry.resolvedModel.modelId}</span>,
                        },
                        {
                          label: "接口根地址",
                          value: <span className="break-all font-mono text-xs text-slate-900">{entry.resolvedModel.baseUrl}</span>,
                        },
                        {
                          label: "模型级推理强度",
                          value: formatReasoning(entry.resolvedModel.reasoningEffort, "模型没有默认值"),
                        },
                        {
                          label: "入口级覆盖",
                          value: entry.reasoningEffortOverride ? `${entry.reasoningEffortOverride}（入口覆盖生效）` : "跟随模型",
                        },
                        {
                          label: "最终生效值",
                          value: formatReasoning(entry.effectiveReasoningEffort, "当前没有生效值"),
                          emphasize: true,
                        },
                        {
                          label: "密钥状态",
                          value: entry.resolvedModel.hasStoredApiKey ? "已存厂商密钥" : "缺少厂商密钥",
                        },
                        {
                          label: "模型状态",
                          value: humanizeModelStatus(entry.resolvedModel.status),
                        },
                      ]}
                    />
                  ) : (
                    <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/70 p-4">
                      <p className="text-sm font-semibold text-amber-900">当前还没有解析到真实模型</p>
                      <p className="mt-2 text-sm leading-6 text-amber-900/80">
                        先去<Link href="/models" className="font-semibold underline underline-offset-4">模型库</Link>补齐可用模型，再回到这里绑定入口。
                      </p>
                    </div>
                  )}
                </div>

                {entry.controllable ? (
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <SectionHeading
                      title="入口级覆盖"
                      description="只改这个入口，不影响别的入口。适合单独调浅一点或调深一点。"
                    />
                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
                      <div className="min-w-0 flex-1">
                        <Field
                          label="推理强度覆盖"
                          description="reasoning effort（推理强度 / 思考深浅）"
                        >
                          <Select
                            aria-label={`${entry.entryId} 推理强度覆盖`}
                            value={currentDraft}
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
                      </div>
                      <Button onClick={() => mutation.mutate(entry)} disabled={pending} data-testid={`save-entry-${entry.entryId}`}>
                        {pending ? "正在保存..." : "保存入口覆盖"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <SectionHeading
                    title="一次性接入模板"
                    description="外部客户端只看这几行就能接线：地址、模型 alias（别名）、认证头。以后切模型和切密钥都回 RelayHub 改。"
                  />
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p>
                      URL：<span className="font-mono text-xs text-slate-950">{resolveRelayUrl(entry)}</span>
                    </p>
                    <p>
                      model：<span className="font-mono text-xs text-slate-950">{entry.alias ?? "未设置 alias"}</span>
                    </p>
                    <p>
                      认证：<span className="font-mono text-xs text-slate-950">Authorization: Bearer &lt;{RELAY_TOKEN_NAME}&gt;</span>
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {observeEntries.length > 0 ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
          <SectionHeading
            eyebrow="次级区块"
            title="观测入口"
            description="这些入口不进入 RelayHub 数据面，只用来记录、对比或帮助你理解外部使用情况。"
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {observeEntries.map((entry) => (
              <div key={entry.entryId} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{entry.alias ?? entry.entryId}</Badge>
                  <Badge tone="warning">只观测</Badge>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-900">{entry.entryId}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {humanizeClient(entry.clientFamily)} / {humanizeHost(entry.hostType)} / {humanizeProtocol(entry.protocolFamily)}
                </p>
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

function humanizeClient(value: EntryBindingResolution["clientFamily"]) {
  if (value === "claude") return "Claude";
  if (value === "codex") return "Codex";
  if (value === "paperclip") return "Paperclip";
  return "未知客户端";
}

function humanizeAdapter(value: EntryBindingResolution["adapterType"]) {
  if (value === "claude_local") return "Claude 本地 adapter";
  if (value === "codex_local") return "Codex 本地 adapter";
  if (value === "pi_local") return "PI 本地 adapter";
  if (value === "hermes_local") return "Hermes 本地 adapter";
  return "无 adapter";
}

function humanizeHost(value: EntryBindingResolution["hostType"]) {
  if (value === "mac") return "Mac 本机";
  if (value === "server") return "服务器";
  if (value === "external-observe") return "外部观测";
  return "未知主机";
}

function humanizeProtocol(value: EntryBindingResolution["protocolFamily"]) {
  if (value === "anthropic-messages") return "Anthropic Messages（Claude 协议）";
  if (value === "openai-responses") return "OpenAI Responses（Responses 协议）";
  if (value === "openai-chat-completions") return "OpenAI Chat Completions（聊天补全协议）";
  if (value === "observe-only") return "Observe Only（只观测）";
  return "未知协议";
}

function humanizeModelStatus(value: string) {
  if (value === "preset-unconfigured") return "预置未激活";
  if (value === "configured-pending-test") return "已配置待测试";
  if (value === "active") return "测试通过可用";
  if (value === "test-failed") return "测试失败";
  if (value === "disabled") return "已停用";
  return value;
}
