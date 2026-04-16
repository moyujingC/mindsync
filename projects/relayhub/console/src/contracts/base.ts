import type { ProviderFilters } from "../models/console";

export type ContractResource = "dashboard" | "environments" | "providers" | "eval";
export type ContractScope = "overview" | "collection" | "detail";
export type ContractStatus = "ready" | "empty" | "not-found";

export interface ContractMeta {
  source: "local-mock";
  generatedAt: string;
  version: "v1";
  resource: ContractResource;
  scope: ContractScope;
  status: ContractStatus;
  filters?: ProviderFilters;
}

export interface ContractCollectionResponse<T> {
  meta: ContractMeta;
  items: T[];
}

export interface ContractDetailResponse<T> {
  meta: ContractMeta;
  item: T | null;
}

export interface ContractOverviewResponse<T> {
  meta: ContractMeta;
  overview: T;
}
