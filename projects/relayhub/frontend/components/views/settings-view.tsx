"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRelayAccessSummary, patchRelayAccess } from "@/lib/api";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { KeyValueList } from "@/components/ui/key-value-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { StateCard } from "@/components/ui/state-card";
import { SummaryCard } from "@/components/ui/summary-card";

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
      {feedback ? <AlertBanner tone="success">{feedback}</AlertBanner> : null}
      {error ? <AlertBanner tone="danger">{error}</AlertBanner> : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <SummaryCard
          label="当前状态"
          value={summary?.maskedRelayToken ?? "未配置"}
          hint="这里显示的是脱敏后的 RelayHub 门禁 token。它只是门口门禁卡，不是上游模型厂商密钥。"
          tone={summary?.hasStoredRelayToken ? "success" : "warning"}
        />
        <SummaryCard
          label="当前来源"
          value={formatSource(summary?.effectiveSource ?? "missing")}
          hint="优先看控制台托管值；如果为空，再回退到服务器环境变量。"
        />
        <SummaryCard
          label="最近更新"
          value={summary?.updatedAt ?? "尚未保存"}
          hint="只记录通过控制台写入的最近更新时间。"
        />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
        <SectionHeading
          eyebrow="系统设置"
          title="Relay 门禁"
          description="这里管理的是谁能调用 RelayHub 的中转 API。你可以把它理解成 RelayHub 自己门口的门禁卡，不是 OpenAI、Anthropic、DeepSeek 这些上游厂商的 API Key。"
        />

        <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={summary?.hasStoredRelayToken ? "success" : "warning"}>{summary?.hasStoredRelayToken ? "已托管门禁 token" : "当前未托管"}</Badge>
            <Badge>{formatSource(summary?.effectiveSource ?? "missing")}</Badge>
          </div>

          <div className="mt-5">
            <KeyValueList
              items={[
                { label: "脱敏展示", value: summary?.maskedRelayToken ?? "未配置", emphasize: true },
                { label: "当前来源", value: formatSource(summary?.effectiveSource ?? "missing") },
                { label: "最近更新", value: summary?.updatedAt ?? "还没有通过控制台保存过" },
                { label: "当前策略", value: "控制台值优先；为空时回退到服务器环境变量。" },
              ]}
            />
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5" data-testid="relay-token-panel">
          <SectionHeading
            title="保存新的门禁 token"
            description="留空保存表示清空控制台托管值。清空后会回退到服务器环境变量；如果环境变量也没有，中转入口会拒绝访问。"
          />

          <div className="mt-5 max-w-2xl space-y-4">
            <Field
              label="新的 RelayHub 门禁 token"
              description="这是 RelayHub 自己的门禁卡，不是厂商模型密钥。"
            >
              <Input
                aria-label="新的 RelayHub 门禁 token"
                type="password"
                autoComplete="off"
                placeholder="例如：relayhub-paperclip-prod"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </Field>
            <Button onClick={() => mutation.mutate(draft)} disabled={mutation.isPending} data-testid="save-relay-token-button">
              {mutation.isPending ? "正在保存..." : "保存门禁 token"}
            </Button>
          </div>
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
