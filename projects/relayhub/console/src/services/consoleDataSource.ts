import type {
  DashboardOverviewContract,
  EnvironmentCollectionContract,
  EnvironmentDetailContract,
  EvalOverviewContract,
  ProviderCollectionContract,
  ProviderDetailContract,
} from "../contracts";
import type { MockRequestOptions, ProviderFilters } from "../models/console";

export interface ConsoleReadonlyDataSource {
  getDashboardOverview(options?: MockRequestOptions): Promise<DashboardOverviewContract>;
  listEnvironments(options?: MockRequestOptions): Promise<EnvironmentCollectionContract>;
  getEnvironment(id: string, options?: MockRequestOptions): Promise<EnvironmentDetailContract>;
  listProviders(
    filters?: ProviderFilters,
    options?: MockRequestOptions,
  ): Promise<ProviderCollectionContract>;
  getProvider(id: string, options?: MockRequestOptions): Promise<ProviderDetailContract>;
  getEvalOverview(options?: MockRequestOptions): Promise<EvalOverviewContract>;
}
