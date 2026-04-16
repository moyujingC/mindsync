import * as mockApi from "../mocks/consoleApi";
import type { ConsoleReadonlyDataSource } from "./consoleDataSource";

export const defaultConsoleReadonlyDataSource: ConsoleReadonlyDataSource = {
  getDashboardOverview: (options) => mockApi.getDashboardOverview(options),
  listEnvironments: (options) => mockApi.listEnvironments(options),
  getEnvironment: (id, options) => mockApi.getEnvironment(id, options),
  listProviders: (filters = {}, options) => mockApi.listProviders(filters, options),
  getProvider: (id, options) => mockApi.getProvider(id, options),
  getEvalOverview: (options) => mockApi.getEvalOverview(options),
};

export function getConsoleReadonlyDataSource(): ConsoleReadonlyDataSource {
  return defaultConsoleReadonlyDataSource;
}
