import type {
  ContractCollectionResponse,
  ContractDetailResponse,
  ContractOverviewResponse,
  ReadonlyApiResponse,
} from "../contracts";

export function adaptOverviewContractToReadonlyApiResponse<T, TFilters = undefined>(
  response: ContractOverviewResponse<T, TFilters>,
): ReadonlyApiResponse<T, TFilters> {
  return {
    meta: response.meta,
    data: response.overview,
  };
}

export function adaptCollectionContractToReadonlyApiResponse<T, TFilters = undefined>(
  response: ContractCollectionResponse<T, TFilters>,
): ReadonlyApiResponse<T[], TFilters> {
  return {
    meta: response.meta,
    data: response.items,
  };
}

export function adaptDetailContractToReadonlyApiResponse<T, TFilters = undefined>(
  response: ContractDetailResponse<T, TFilters>,
): ReadonlyApiResponse<T | null, TFilters> {
  return {
    meta: response.meta,
    data: response.item,
  };
}
