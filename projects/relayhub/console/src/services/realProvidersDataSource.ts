import type {
  ContractMeta,
  ProviderCollectionContract,
  ProviderDetailContract,
  ProviderFilterSnapshot,
} from "../contracts";
import type { ConsoleReadonlyDataSource } from "./consoleDataSource";

function createMeta(
  status: "ready" | "empty" | "not-found",
  scope: "collection",
  filters?: ProviderFilterSnapshot,
): ContractMeta<ProviderFilterSnapshot> {
  return {
    source: "local-mock" as const,
    generatedAt: "2026-04-16T00:00:00+08:00",
    version: "v1" as const,
    resource: "providers" as const,
    scope,
    status,
    ...(filters ? { filters } : {}),
  };
}

function createDetailMeta(status: "ready" | "not-found"): ContractMeta {
  return {
    source: "local-mock",
    generatedAt: "2026-04-16T00:00:00+08:00",
    version: "v1",
    resource: "providers",
    scope: "detail",
    status,
  };
}

export const realProvidersReadonlyDataSourceStub: Pick<
  ConsoleReadonlyDataSource,
  "listProviders" | "getProvider"
> = {
  async listProviders(filters = {}): Promise<ProviderCollectionContract> {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== "全部"),
    ) as ProviderFilterSnapshot;

    const items =
      activeFilters.kind === "国产模型"
        ? [
            {
              id: "provider-real-stub",
              name: "Providers Real Stub",
              kind: "国产模型" as const,
              availableEnvironments: ["评测版"],
              health: "healthy" as const,
              transparency: "完整" as const,
              errorRate: 0.4,
              p95Latency: 880,
              description: "用于验证 providers datasource 可替换，不代表真实网络请求。",
              recommendation: "仅作为只读 API 骨架验证",
              recommendationNote: "当前仍由本地 stub 提供，不接真实后端。",
              models: [{ name: "stub-provider-model", useCase: "providers datasource seam" }],
              metrics: {
                requests: 120,
                tokens: 48000,
                avgLatency: 520,
                p95Latency: 880,
                errorRate: 0.4,
                cost: 12,
              },
            },
          ]
        : [];

    return {
      meta: createMeta(items.length > 0 ? "ready" : "empty", "collection", activeFilters),
      items,
    };
  },

  async getProvider(id): Promise<ProviderDetailContract> {
    if (id !== "provider-real-stub") {
      return {
        meta: createDetailMeta("not-found"),
        item: null,
      };
    }

    return {
      meta: createDetailMeta("ready"),
      item: {
        id: "provider-real-stub",
        name: "Providers Real Stub",
        kind: "国产模型",
        availableEnvironments: ["评测版"],
        health: "healthy",
        transparency: "完整",
        errorRate: 0.4,
        p95Latency: 880,
        description: "用于验证 providers datasource 可替换，不代表真实网络请求。",
        recommendation: "仅作为只读 API 骨架验证",
        recommendationNote: "当前仍由本地 stub 提供，不接真实后端。",
        models: [{ name: "stub-provider-model", useCase: "providers datasource seam" }],
        metrics: {
          requests: 120,
          tokens: 48000,
          avgLatency: 520,
          p95Latency: 880,
          errorRate: 0.4,
          cost: 12,
        },
      },
    };
  },
};
