import * as mockApi from "../mocks/consoleApi";
import type { MockRequestOptions, ProviderFilters } from "../models/console";

export function getDashboardOverview(options?: MockRequestOptions) {
  return mockApi.getDashboardOverview(options).then((response) => response.overview);
}

export function listEnvironments(options?: MockRequestOptions) {
  return mockApi.listEnvironments(options).then((response) => response.items);
}

export function getEnvironment(id: string, options?: MockRequestOptions) {
  return mockApi.getEnvironment(id, options).then((response) => response.item);
}

export function listProviders(filters: ProviderFilters = {}, options?: MockRequestOptions) {
  return mockApi.listProviders(filters, options).then((response) => response.items);
}

export function getProvider(id: string, options?: MockRequestOptions) {
  return mockApi.getProvider(id, options).then((response) => response.item);
}

export function getEvalOverview(options?: MockRequestOptions) {
  return mockApi.getEvalOverview(options).then((response) => response.overview);
}
