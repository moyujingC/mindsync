import * as mockApi from "../mocks/consoleApi";
import type { MockRequestOptions, ProviderFilters } from "../models/console";
import type {
  DashboardOverviewContract,
  EnvironmentCollectionContract,
  EnvironmentDetailContract,
  EvalOverviewContract,
  ProviderCollectionContract,
  ProviderDetailContract,
} from "../contracts/console";

export function getDashboardOverviewRaw(
  options?: MockRequestOptions,
): Promise<DashboardOverviewContract> {
  return mockApi.getDashboardOverview(options);
}

export function getDashboardOverview(options?: MockRequestOptions) {
  return getDashboardOverviewRaw(options).then((response) => response.overview);
}

export function listEnvironmentsRaw(
  options?: MockRequestOptions,
): Promise<EnvironmentCollectionContract> {
  return mockApi.listEnvironments(options);
}

export function listEnvironments(options?: MockRequestOptions) {
  return listEnvironmentsRaw(options).then((response) => response.items);
}

export function getEnvironmentRaw(
  id: string,
  options?: MockRequestOptions,
): Promise<EnvironmentDetailContract> {
  return mockApi.getEnvironment(id, options);
}

export function getEnvironment(id: string, options?: MockRequestOptions) {
  return getEnvironmentRaw(id, options).then((response) => response.item);
}

export function listProvidersRaw(
  filters: ProviderFilters = {},
  options?: MockRequestOptions,
): Promise<ProviderCollectionContract> {
  return mockApi.listProviders(filters, options);
}

export function listProviders(filters: ProviderFilters = {}, options?: MockRequestOptions) {
  return listProvidersRaw(filters, options).then((response) => response.items);
}

export function getProviderRaw(
  id: string,
  options?: MockRequestOptions,
): Promise<ProviderDetailContract> {
  return mockApi.getProvider(id, options);
}

export function getProvider(id: string, options?: MockRequestOptions) {
  return getProviderRaw(id, options).then((response) => response.item);
}

export function getEvalOverviewRaw(
  options?: MockRequestOptions,
): Promise<EvalOverviewContract> {
  return mockApi.getEvalOverview(options);
}

export function getEvalOverview(options?: MockRequestOptions) {
  return getEvalOverviewRaw(options).then((response) => response.overview);
}
