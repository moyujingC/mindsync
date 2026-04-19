export type ContractResource = "dashboard" | "environments" | "providers" | "eval";
export type ContractScope = "overview" | "collection" | "detail";
export type ContractStatus = "ready" | "empty" | "not-found";

export type ReadonlyApiResource = ContractResource;
export type ReadonlyApiScope = ContractScope;
export type ReadonlyApiStatus = ContractStatus;

export interface ContractMeta<TFilters = undefined> {
  source: "local-mock";
  generatedAt: string;
  version: "v1";
  resource: ContractResource;
  scope: ContractScope;
  status: ContractStatus;
  filters?: TFilters;
}

export type ReadonlyApiMeta<TFilters = undefined> = ContractMeta<TFilters>;

export interface ContractCollectionResponse<T, TFilters = undefined> {
  meta: ContractMeta<TFilters>;
  items: T[];
}

export interface ContractDetailResponse<T, TFilters = undefined> {
  meta: ContractMeta<TFilters>;
  item: T | null;
}

export interface ContractOverviewResponse<T, TFilters = undefined> {
  meta: ContractMeta<TFilters>;
  overview: T;
}

export interface ReadonlyApiResponse<T, TFilters = undefined> {
  meta: ReadonlyApiMeta<TFilters>;
  data: T;
}
