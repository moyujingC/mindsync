import type { ProviderRecordContract } from "../contracts";

export const PROVIDERS_READONLY_TRIAL_BASE_URL = "https://relayhub.internal/api";

export function createProvidersReadonlyCollectionItem(
  overrides: Partial<ProviderRecordContract> = {},
): ProviderRecordContract {
  return {
    id: "provider-trial-stub",
    name: "Providers Trial Stub",
    kind: "国产模型",
    availableEnvironments: ["评测版"],
    health: "healthy",
    transparency: "完整",
    errorRate: 0.1,
    p95Latency: 300,
    description: "用于验证 Providers readonly 最小接入 collection 契约",
    recommendation: "用于验证 readonly 最小接入契约",
    recommendationNote: "不代表真实后端已接入。",
    models: [{ name: "providers-trial-model", useCase: "minimal integration verification" }],
    metrics: {
      requests: 12,
      tokens: 2400,
      avgLatency: 220,
      p95Latency: 300,
      errorRate: 0.1,
      cost: 2,
    },
    ...overrides,
  };
}

export function createProvidersReadonlyDetailItem(
  overrides: Partial<ProviderRecordContract> = {},
): ProviderRecordContract {
  return {
    ...createProvidersReadonlyCollectionItem(),
    description: "用于验证 Providers readonly 最小接入 detail 契约",
    ...overrides,
  };
}

export function createProvidersReadonlyCollectionSuccessPayload(
  overrides: Partial<ProviderRecordContract> = {},
) {
  return {
    items: [createProvidersReadonlyCollectionItem(overrides)],
  };
}

export function createProvidersReadonlyCollectionEmptyPayload() {
  return {
    items: [],
  };
}

export function createProvidersReadonlyDetailSuccessPayload(
  overrides: Partial<ProviderRecordContract> = {},
) {
  return {
    item: createProvidersReadonlyDetailItem(overrides),
  };
}

export function createProvidersReadonlyDetailNotFoundPayload() {
  return {
    item: null,
  };
}

export function createProvidersReadonlyJsonResponse(status: number, payload: unknown) {
  return {
    status,
    json: async () => payload,
  };
}
