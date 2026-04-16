import * as mockApi from "../mocks/consoleApi";
import type { MockRequestOptions, ProviderFilters } from "../models/console";

export function getDashboardOverview(options?: MockRequestOptions) {
  return mockApi.getDashboardOverview(options);
}

export function listEnvironments(options?: MockRequestOptions) {
  return mockApi.listEnvironments(options);
}

export function getEnvironment(id: string, options?: MockRequestOptions) {
  return mockApi.getEnvironment(id, options);
}

export function listProviders(filters: ProviderFilters = {}, options?: MockRequestOptions) {
  return mockApi.listProviders(filters, options);
}

export function getProvider(id: string, options?: MockRequestOptions) {
  return mockApi.getProvider(id, options);
}

export function getEvalOverview(options?: MockRequestOptions) {
  return mockApi.getEvalOverview(options);
}
