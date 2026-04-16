import * as mockApi from "../mocks/consoleApi";
import type { ConsoleReadonlyDataSource } from "./consoleDataSource";

export const mockDashboardReadonlyDataSource = {
  getDashboardOverview: (options?: Parameters<typeof mockApi.getDashboardOverview>[0]) =>
    mockApi.getDashboardOverview(options),
};

export const mockEnvironmentsReadonlyDataSource = {
  listEnvironments: (options?: Parameters<typeof mockApi.listEnvironments>[0]) =>
    mockApi.listEnvironments(options),
  getEnvironment: (
    id: Parameters<typeof mockApi.getEnvironment>[0],
    options?: Parameters<typeof mockApi.getEnvironment>[1],
  ) => mockApi.getEnvironment(id, options),
};

export const mockProvidersReadonlyDataSource = {
  listProviders: (
    filters: Parameters<typeof mockApi.listProviders>[0] = {},
    options?: Parameters<typeof mockApi.listProviders>[1],
  ) => mockApi.listProviders(filters, options),
  getProvider: (
    id: Parameters<typeof mockApi.getProvider>[0],
    options?: Parameters<typeof mockApi.getProvider>[1],
  ) => mockApi.getProvider(id, options),
};

export const mockEvalReadonlyDataSource = {
  getEvalOverview: (options?: Parameters<typeof mockApi.getEvalOverview>[0]) =>
    mockApi.getEvalOverview(options),
};

interface ConsoleReadonlyDataSourceOverrides {
  providersSource?: Pick<ConsoleReadonlyDataSource, "listProviders" | "getProvider">;
}

export function createConsoleReadonlyDataSource(
  overrides: ConsoleReadonlyDataSourceOverrides = {},
): ConsoleReadonlyDataSource {
  return {
    getDashboardOverview: mockDashboardReadonlyDataSource.getDashboardOverview,
    listEnvironments: mockEnvironmentsReadonlyDataSource.listEnvironments,
    getEnvironment: mockEnvironmentsReadonlyDataSource.getEnvironment,
    listProviders:
      overrides.providersSource?.listProviders ?? mockProvidersReadonlyDataSource.listProviders,
    getProvider:
      overrides.providersSource?.getProvider ?? mockProvidersReadonlyDataSource.getProvider,
    getEvalOverview: mockEvalReadonlyDataSource.getEvalOverview,
  };
}

export const defaultConsoleReadonlyDataSource = createConsoleReadonlyDataSource();

export function getConsoleReadonlyDataSource(): ConsoleReadonlyDataSource {
  return defaultConsoleReadonlyDataSource;
}
