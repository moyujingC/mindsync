import type {
  ContractCollectionResponse,
  ContractDetailResponse,
  ReadonlyApiResponse,
} from "./base";
import type { ContractHealthState, ContractMetricsSnapshot } from "./environments";

export type ContractProviderKind = "第三方中转" | "国产模型" | "免费国外 API";
export type ContractTransparencyState = "完整" | "部分缺失" | "暂无";

export interface ProviderModelContract {
  name: string;
  useCase: string;
}

export interface ProviderRecordContract {
  id: string;
  name: string;
  kind: ContractProviderKind;
  availableEnvironments: string[];
  health: ContractHealthState;
  transparency: ContractTransparencyState;
  errorRate: number;
  p95Latency: number;
  description: string;
  recommendation: string;
  recommendationNote: string;
  models: ProviderModelContract[];
  metrics: ContractMetricsSnapshot | null;
}

export interface ProviderFilterSnapshot {
  kind?: ContractProviderKind;
  environment?: string;
  health?: ContractHealthState;
  transparency?: ContractTransparencyState;
}

export type ProviderCollectionContract = ContractCollectionResponse<
  ProviderRecordContract,
  ProviderFilterSnapshot
>;
export type ProviderDetailContract = ContractDetailResponse<ProviderRecordContract>;
export type ProviderCollectionReadonlyApiResponse = ReadonlyApiResponse<
  ProviderRecordContract[],
  ProviderFilterSnapshot
>;
export type ProviderDetailReadonlyApiResponse = ReadonlyApiResponse<ProviderRecordContract | null>;
