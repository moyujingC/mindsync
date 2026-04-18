import type { ProviderRecordContract } from "../contracts";
import type { ProviderFilterSnapshot } from "../contracts";

export interface OpenAICompatibleModelWireRecord {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  root?: string;
  parent?: string | null;
}

export interface OpenAICompatibleModelsListWirePayload {
  data: OpenAICompatibleModelWireRecord[];
  object?: string;
  success?: boolean;
}

const OPENAI_MODELS_PROVIDER_ENVIRONMENTS = ["开发版"] as const;

function isOpenAICompatibleModelWireRecord(
  value: unknown,
): value is OpenAICompatibleModelWireRecord {
  return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string";
}

export function adaptOpenAICompatibleModelsListWirePayload(
  payload: unknown,
): OpenAICompatibleModelsListWirePayload {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("data" in payload) ||
    !Array.isArray(payload.data) ||
    !payload.data.every(isOpenAICompatibleModelWireRecord)
  ) {
    throw new Error("OpenAI-compatible models wire payload is invalid");
  }

  const optionalObject = "object" in payload && typeof payload.object === "string"
    ? payload.object
    : undefined;
  const optionalSuccess = "success" in payload && typeof payload.success === "boolean"
    ? payload.success
    : undefined;

  return {
    data: payload.data,
    ...(optionalObject ? { object: optionalObject } : {}),
    ...(typeof optionalSuccess === "boolean" ? { success: optionalSuccess } : {}),
  };
}

export function mapOpenAICompatibleModelToProviderRecord(
  model: OpenAICompatibleModelWireRecord,
): ProviderRecordContract {
  const providerName = model.root && model.root.length > 0 ? model.root : model.id;
  const owner = model.owned_by && model.owned_by.length > 0 ? model.owned_by : "unknown";

  return {
    id: model.id,
    name: providerName,
    kind: "第三方中转",
    availableEnvironments: [...OPENAI_MODELS_PROVIDER_ENVIRONMENTS],
    health: "healthy",
    transparency: "部分缺失",
    errorRate: 0,
    p95Latency: 0,
    description: `来自 OpenAI-compatible /v1/models 目录适配，owner=${owner}。`,
    recommendation: "当前仅验证模型目录可见性",
    recommendationNote: "缺少真实运行指标与治理元数据，不代表正式治理结论。",
    models: [
      {
        name: model.id,
        useCase: "OpenAI-compatible model catalog",
      },
    ],
    metrics: null,
  };
}

export function filterOpenAICompatibleProviderRecords(
  items: ProviderRecordContract[],
  filters?: ProviderFilterSnapshot,
): ProviderRecordContract[] {
  return items.filter((item) => {
    if (filters?.kind && item.kind !== filters.kind) {
      return false;
    }

    if (filters?.environment && !item.availableEnvironments.includes(filters.environment)) {
      return false;
    }

    if (filters?.health && item.health !== filters.health) {
      return false;
    }

    if (filters?.transparency && item.transparency !== filters.transparency) {
      return false;
    }

    return true;
  });
}
