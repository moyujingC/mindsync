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
  CollectionResponse,
  DashboardOverview,
  DetailResponse,
  EnvironmentRecord,
  EvalOverview,
  MockRequestOptions,
  OverviewResponse,
  ProviderFilters,
  ProviderRecord,
} from "../models/console";

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

function createMeta() {
  return {
    source: "local-mock" as const,
    generatedAt: MOCK_GENERATED_AT,
  };
}

export async function getDashboardOverview(
  options?: MockRequestOptions,
): Promise<OverviewResponse<DashboardOverview>> {
  return delayed(
    {
      meta: createMeta(),
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
): Promise<CollectionResponse<EnvironmentRecord>> {
  return delayed(
    {
      meta: createMeta(),
      items: environments,
    },
    options,
  );
}

export async function getEnvironment(
  id: string,
  options?: MockRequestOptions,
): Promise<DetailResponse<EnvironmentRecord>> {
  const environment = environments.find((item) => item.id === id) ?? null;
  return delayed(
    {
      meta: createMeta(),
      item: environment,
    },
    options,
  );
}

export async function listProviders(
  filters: ProviderFilters = {},
  options?: MockRequestOptions,
): Promise<CollectionResponse<ProviderRecord>> {
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
      meta: createMeta(),
      items: filteredProviders,
    },
    options,
  );
}

export async function getProvider(
  id: string,
  options?: MockRequestOptions,
): Promise<DetailResponse<ProviderRecord>> {
  const provider = providers.find((item) => item.id === id) ?? null;
  return delayed(
    {
      meta: createMeta(),
      item: provider,
    },
    options,
  );
}

export async function getEvalOverview(
  options?: MockRequestOptions,
): Promise<OverviewResponse<EvalOverview>> {
  return delayed(
    {
      meta: createMeta(),
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
