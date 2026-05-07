"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRelayAccessSummary, patchRelayAccess } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StateCard } from "@/components/ui/state-card";

export function SettingsView() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["relay-access"],
    queryFn: getRelayAccessSummary,
  });

  const mutation = useMutation({
    mutationFn: patchRelayAccess,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["relay-access"] });
      setFeedback(
        result.hasStoredRelayToken
          ? "RelayHub 门禁 token 已保存。以后客户端访问 RelayHub，会先认这把门禁卡。"
          : "RelayHub 门禁 token 已清空。当前会回退到服务器环境变量。",
      );
      setError(null);
      setDraft("");
    },
    onError: (currentError) => {
      setError(currentError instanceof Error ? currentError.message : "保存 RelayHub 门禁 token 失败。");
      setFeedback(null);
    },
  });

  if (query.isLoading) {
    return <StateCard title="正在读取门禁配置" description="正在加载当前 RelayHub 门禁卡状态。" />;
  }

  if (query.isError) {
    return <StateCard title="读取失败" description={query.error instanceof Error ? query.error.message : "暂时无法读取门禁状态。"} />;
  }

  const summary = query.data;

  return (
    <div className="space-y-6">
      {feedback ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}

      <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
        <h3 className="text-lg font-semibold text-slate-950">Relay 门禁</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          这里管理的是谁能调用 RelayHub 中转 API。你可以把它理解成 RelayHub 自己门口的门禁卡，不是 OpenAI、Anthropic、DeepSeek 这些上游厂商的 API Key。
        </p>

        <div className="mt-6 space-y-3 text-sm text-slate-700">
          <p>当前状态：<span className="font-medium text-slate-950">{summary?.maskedRelayToken ?? "未配置"}</span></p>
          <p>当前生效来源：{formatSource(summary?.effectiveSource ?? "missing")}</p>
          <p>最近更新：{summary?.updatedAt ?? "还没有通过控制台保存过"}</p>
        </div>

        <div className="mt-6 max-w-2xl space-y-4">
          <Field
            label="新的 RelayHub 门禁 token"
            hint="留空保存，表示清空控制台托管值。清空后会回退到服务器环境变量；如果环境变量也没有，中转入口会拒绝访问。"
          >
            <Input
              type="password"
              autoComplete="off"
              placeholder="例如：relayhub-paperclip-prod"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
          <Button onClick={() => mutation.mutate(draft)} disabled={mutation.isPending}>
            {mutation.isPending ? "正在保存..." : "保存门禁 token"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function formatSource(source: "control-plane" | "environment" | "missing") {
  if (source === "control-plane") return "控制台托管值";
  if (source === "environment") return "服务器环境变量兜底";
  return "未配置";
}
