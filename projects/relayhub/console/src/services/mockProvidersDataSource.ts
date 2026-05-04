import * as mockApi from "../mocks/consoleApi";

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
