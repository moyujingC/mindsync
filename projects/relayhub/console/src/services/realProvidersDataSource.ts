import type {
  ContractMeta,
  ProviderCollectionContract,
  ProviderDetailContract,
  ProviderFilterSnapshot,
} from "../contracts";
import type {
  MockRequestOptions,
  ProviderFilters,
  ProviderKind,
  TransparencyState,
} from "../models/console";
import type { ConsoleReadonlyDataSource } from "./consoleDataSource";
import {
  adaptOpenAICompatibleModelsListWirePayload,
  filterOpenAICompatibleProviderRecords,
  mapOpenAICompatibleModelToProviderRecord,
} from "./openAICompatibleModelsAdapter";
import {
  adaptProviderDetailWirePayload,
  adaptProvidersCollectionWirePayload,
} from "./realProvidersAdapter";
import type {
  ProviderDetailWirePayload,
  ProvidersCollectionWirePayload,
} from "./realProvidersAdapter";
import type {
  ProvidersReadonlyTransport,
  ProvidersReadonlyTransportRequest,
} from "./realProvidersTransport";
import {
  createRealProvidersFetchTransport,
} from "./realProvidersFetchTransport";
import type { ProvidersReadonlyTransportConfig } from "./realProvidersFetchTransport";

const PROVIDER_KIND_OPTIONS: ProviderKind[] = ["第三方中转", "国产模型", "免费国外 API"];
const PROVIDER_ENVIRONMENT_OPTIONS = ["开发版", "心理疗愈生产版", "评测版"] as const;
const PROVIDER_HEALTH_OPTIONS = ["healthy", "degraded", "risk", "idle"] as const;
const PROVIDER_TRANSPARENCY_OPTIONS: TransparencyState[] = ["完整", "部分缺失", "暂无"];
const PROVIDERS_BASE_PATH = "/providers";
const OPENAI_MODELS_BASE_PATH = "/models";

// Default real Providers datasource contract:
// - collection path is /providers plus sanitized query filters
// - detail path is /providers/:id
// - transport 404 + null maps to contract-level not-found
function isAllowedValue<T extends readonly string[]>(
  value: string | undefined,
  options: T,
): value is T[number] {
  return value !== undefined && options.includes(value as T[number]);
}

export function sanitizeProviderFiltersForRequest(
  filters: ProviderFilters = {},
): ProviderFilterSnapshot | undefined {
  const nextFilters: ProviderFilterSnapshot = {};

  if (isAllowedValue(filters.kind, PROVIDER_KIND_OPTIONS)) {
    nextFilters.kind = filters.kind;
  }

  if (isAllowedValue(filters.environment, PROVIDER_ENVIRONMENT_OPTIONS)) {
    nextFilters.environment = filters.environment;
  }

  if (isAllowedValue(filters.health, PROVIDER_HEALTH_OPTIONS)) {
    nextFilters.health = filters.health;
  }

  if (isAllowedValue(filters.transparency, PROVIDER_TRANSPARENCY_OPTIONS)) {
    nextFilters.transparency = filters.transparency;
  }

  return Object.keys(nextFilters).length > 0 ? nextFilters : undefined;
}

export function buildProvidersCollectionPath(filters: ProviderFilterSnapshot = {}): string {
  const searchParams = new URLSearchParams();

  if (filters.kind) {
    searchParams.set("kind", filters.kind);
  }

  if (filters.environment) {
    searchParams.set("environment", filters.environment);
  }

  if (filters.health) {
    searchParams.set("health", filters.health);
  }

  if (filters.transparency) {
    searchParams.set("transparency", filters.transparency);
  }

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `${PROVIDERS_BASE_PATH}?${queryString}` : PROVIDERS_BASE_PATH;
}

export function buildProviderDetailPath(providerId: string): string {
  return `${PROVIDERS_BASE_PATH}/${providerId}`;
}

export function buildOpenAICompatibleModelsCollectionPath(): string {
  return OPENAI_MODELS_BASE_PATH;
}

function createCollectionMeta(
  status: "ready" | "empty",
  filters?: ProviderFilterSnapshot,
): ContractMeta<ProviderFilterSnapshot> {
  return {
    source: "local-mock",
    generatedAt: "2026-04-16T00:00:00+08:00",
    version: "v1",
    resource: "providers",
    scope: "collection",
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

interface CreateRealProvidersReadonlyDataSourceOptions {
  transport: ProvidersReadonlyTransport;
  adapters?: {
    collection?: (payload: unknown) => ProvidersCollectionWirePayload;
    detail?: (payload: unknown) => ProviderDetailWirePayload;
  };
}

export function createRealProvidersReadonlyDataSource(
  options: CreateRealProvidersReadonlyDataSourceOptions,
): Pick<ConsoleReadonlyDataSource, "listProviders" | "getProvider"> {
  const collectionAdapter = options.adapters?.collection ?? adaptProvidersCollectionWirePayload;
  const detailAdapter = options.adapters?.detail ?? adaptProviderDetailWirePayload;

  return {
    async listProviders(
      filters: ProviderFilters = {},
      requestOptions?: MockRequestOptions,
    ): Promise<ProviderCollectionContract> {
      const sanitizedFilters = sanitizeProviderFiltersForRequest(filters);
      const response = await options.transport({
        resource: "providers",
        scope: "collection",
        path: buildProvidersCollectionPath(sanitizedFilters),
        filters: sanitizedFilters,
        forceError: requestOptions?.forceError,
      });
      const payload = collectionAdapter(response.data);

      return {
        meta: createCollectionMeta(
          payload.items.length > 0 ? "ready" : "empty",
          sanitizedFilters,
        ),
        items: payload.items,
      };
    },

    async getProvider(id: string, requestOptions?: MockRequestOptions): Promise<ProviderDetailContract> {
      const response = await options.transport({
        resource: "providers",
        scope: "detail",
        path: buildProviderDetailPath(id),
        providerId: id,
        forceError: requestOptions?.forceError,
      });
      if (response.statusCode === 404 && response.data === null) {
        return {
          meta: createDetailMeta("not-found"),
          item: null,
        };
      }
      const payload = detailAdapter(response.data);

      return {
        meta: createDetailMeta(payload.item ? "ready" : "not-found"),
        item: payload.item,
      };
    },
  };
}

export const realProvidersReadonlyDataSourceStub = createRealProvidersReadonlyDataSource({
  transport: async (input: ProvidersReadonlyTransportRequest) => {
    if (input.forceError) {
      throw new Error("RelayHub providers readonly request error");
    }

    if (input.scope === "collection") {
      const items =
        input.filters?.kind === "国产模型"
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
        data: { items },
      };
    }

    if (input.providerId !== "provider-real-stub") {
      return {
        data: { item: null },
      };
    }

    return {
      data: {
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
      },
    };
  },
});

export function createRealProvidersFetchDataSource(
  config: ProvidersReadonlyTransportConfig,
): Pick<ConsoleReadonlyDataSource, "listProviders" | "getProvider"> {
  if (config.wireContract === "openai-models") {
    const transport = createRealProvidersFetchTransport(config);

    return {
      async listProviders(
        filters: ProviderFilters = {},
        requestOptions?: MockRequestOptions,
      ): Promise<ProviderCollectionContract> {
        const sanitizedFilters = sanitizeProviderFiltersForRequest(filters);
        const response = await transport({
          resource: "providers",
          scope: "collection",
          path: buildOpenAICompatibleModelsCollectionPath(),
          filters: sanitizedFilters,
          forceError: requestOptions?.forceError,
        });
        const payload = adaptOpenAICompatibleModelsListWirePayload(response.data);
        const mappedItems = filterOpenAICompatibleProviderRecords(
          payload.data.map(mapOpenAICompatibleModelToProviderRecord),
          sanitizedFilters,
        );

        return {
          meta: createCollectionMeta(mappedItems.length > 0 ? "ready" : "empty", sanitizedFilters),
          items: mappedItems,
        };
      },

      async getProvider(id: string, requestOptions?: MockRequestOptions): Promise<ProviderDetailContract> {
        const response = await transport({
          resource: "providers",
          scope: "collection",
          path: buildOpenAICompatibleModelsCollectionPath(),
          forceError: requestOptions?.forceError,
        });
        const payload = adaptOpenAICompatibleModelsListWirePayload(response.data);
        const item = payload.data.find((model) => model.id === id);

        return {
          meta: createDetailMeta(item ? "ready" : "not-found"),
          item: item ? mapOpenAICompatibleModelToProviderRecord(item) : null,
        };
      },
    };
  }

  return createRealProvidersReadonlyDataSource({
    transport: createRealProvidersFetchTransport(config),
  });
}
