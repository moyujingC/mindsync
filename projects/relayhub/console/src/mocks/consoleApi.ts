import {
  dashboardDecisions,
  dashboardMetricsSnapshot,
  dashboardRisks,
  environments,
  evalComparisons,
  evalRecommendations,
  evalReports,
  evalScoreboard,
  providers,
  recentRuns,
} from "../fixtures/data";
import type {
  MockRequestOptions,
  ProviderFilters,
} from "../models/console";
import type {
  ContractMeta,
  ContractResource,
  ContractScope,
  ContractStatus,
  DashboardOverviewContract,
  EnvironmentCollectionContract,
  EnvironmentDetailContract,
  EvalOverviewContract,
  ProviderCollectionContract,
  ProviderDetailContract,
  ProviderFilterSnapshot,
} from "../contracts";

const MOCK_LATENCY_MS = 120;
const MOCK_GENERATED_AT = "2026-04-16T00:00:00+08:00";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function delayed<T>(value: T, options?: MockRequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (options?.forceError) {
        reject(new Error("RelayHub mock API error"));
        return;
      }

      resolve(clone(value));
    }, MOCK_LATENCY_MS);
  });
}

function matchesFilter<T extends string>(value: T, current?: T | "全部") {
  return !current || current === "全部" || current === value;
}

function sanitizeProviderFilters(filters: ProviderFilters = {}): ProviderFilterSnapshot | undefined {
  const nextFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "全部"),
  ) as ProviderFilterSnapshot;

  return Object.keys(nextFilters).length > 0 ? nextFilters : undefined;
}

function createMeta<TFilters = undefined>(
  resource: ContractResource,
  scope: ContractScope,
  status: ContractStatus,
  filters?: TFilters,
): ContractMeta<TFilters> {
  return {
    source: "local-mock" as const,
    generatedAt: MOCK_GENERATED_AT,
    version: "v1" as const,
    resource,
    scope,
    status,
    ...(filters ? { filters } : {}),
  };
}

export async function getDashboardOverview(
  options?: MockRequestOptions,
): Promise<DashboardOverviewContract> {
  return delayed(
    {
      meta: createMeta("dashboard", "overview", "ready"),
      overview: {
        environments,
        decisions: dashboardDecisions,
        risks: dashboardRisks,
        metrics: dashboardMetricsSnapshot,
        recentRuns,
      },
    },
    options,
  );
}

export async function listEnvironments(
  options?: MockRequestOptions,
): Promise<EnvironmentCollectionContract> {
  return delayed(
    {
      meta: createMeta("environments", "collection", "ready"),
      items: environments,
    },
    options,
  );
}

export async function getEnvironment(
  id: string,
  options?: MockRequestOptions,
): Promise<EnvironmentDetailContract> {
  const environment = environments.find((item) => item.id === id) ?? null;
  return delayed(
    {
      meta: createMeta("environments", "detail", environment ? "ready" : "not-found"),
      item: environment,
    },
    options,
  );
}

export async function listProviders(
  filters: ProviderFilters = {},
  options?: MockRequestOptions,
): Promise<ProviderCollectionContract> {
  const filteredProviders = providers.filter((provider) => {
    const matchesEnvironment =
      !filters.environment ||
      filters.environment === "全部" ||
      provider.availableEnvironments.includes(filters.environment);

    return (
      matchesFilter(provider.kind, filters.kind) &&
      matchesEnvironment &&
      matchesFilter(provider.health, filters.health) &&
      matchesFilter(provider.transparency, filters.transparency)
    );
  });

  return delayed(
    {
      meta: createMeta(
        "providers",
        "collection",
        filteredProviders.length > 0 ? "ready" : "empty",
        sanitizeProviderFilters(filters),
      ),
      items: filteredProviders,
    },
    options,
  );
}

export async function getProvider(
  id: string,
  options?: MockRequestOptions,
): Promise<ProviderDetailContract> {
  const provider = providers.find((item) => item.id === id) ?? null;
  return delayed(
    {
      meta: createMeta("providers", "detail", provider ? "ready" : "not-found"),
      item: provider,
    },
    options,
  );
}

export async function getEvalOverview(
  options?: MockRequestOptions,
): Promise<EvalOverviewContract> {
  return delayed(
    {
      meta: createMeta("eval", "overview", "ready"),
      overview: {
        scoreboard: evalScoreboard,
        comparisons: evalComparisons,
        recommendations: evalRecommendations,
        reports: evalReports,
      },
    },
    options,
  );
}
