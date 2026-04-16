import * as mockApi from "../mocks/consoleApi";
import type { ConsoleReadonlyDataSource } from "./consoleDataSource";
import { getDefaultProvidersRuntimeBootstrap } from "./providersRuntimeBootstrap";

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

export const mockEvalReadonlyDataSource = {
  getEvalOverview: (options?: Parameters<typeof mockApi.getEvalOverview>[0]) =>
    mockApi.getEvalOverview(options),
};

export { mockProvidersReadonlyDataSource } from "./mockProvidersDataSource";

interface ConsoleReadonlyDataSourceOverrides {
  providersSource?: Pick<ConsoleReadonlyDataSource, "listProviders" | "getProvider">;
}

export function createConsoleReadonlyDataSource(
  overrides: ConsoleReadonlyDataSourceOverrides = {},
): ConsoleReadonlyDataSource {
  const { providersSource } = getDefaultProvidersRuntimeBootstrap();

  return {
    getDashboardOverview: mockDashboardReadonlyDataSource.getDashboardOverview,
    listEnvironments: mockEnvironmentsReadonlyDataSource.listEnvironments,
    getEnvironment: mockEnvironmentsReadonlyDataSource.getEnvironment,
    listProviders:
      overrides.providersSource?.listProviders ?? providersSource.listProviders,
    getProvider:
      overrides.providersSource?.getProvider ?? providersSource.getProvider,
    getEvalOverview: mockEvalReadonlyDataSource.getEvalOverview,
  };
}

export const defaultConsoleReadonlyDataSource = createConsoleReadonlyDataSource();

export function getConsoleReadonlyDataSource(): ConsoleReadonlyDataSource {
  return defaultConsoleReadonlyDataSource;
}
