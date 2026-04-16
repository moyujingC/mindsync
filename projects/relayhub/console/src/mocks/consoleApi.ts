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
  DashboardOverview,
  EnvironmentRecord,
  EvalOverview,
  MockRequestOptions,
  ProviderFilters,
  ProviderRecord,
} from "../models/console";

const MOCK_LATENCY_MS = 120;

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

export async function getDashboardOverview(
  options?: MockRequestOptions,
): Promise<DashboardOverview> {
  return delayed(
    {
      environments,
      decisions: dashboardDecisions,
      risks: dashboardRisks,
      metrics: dashboardMetricsSnapshot,
      recentRuns,
    },
    options,
  );
}

export async function listEnvironments(
  options?: MockRequestOptions,
): Promise<EnvironmentRecord[]> {
  return delayed(environments, options);
}

export async function getEnvironment(
  id: string,
  options?: MockRequestOptions,
): Promise<EnvironmentRecord | null> {
  const environment = environments.find((item) => item.id === id) ?? null;
  return delayed(environment, options);
}

export async function listProviders(
  filters: ProviderFilters = {},
  options?: MockRequestOptions,
): Promise<ProviderRecord[]> {
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

  return delayed(filteredProviders, options);
}

export async function getProvider(
  id: string,
  options?: MockRequestOptions,
): Promise<ProviderRecord | null> {
  const provider = providers.find((item) => item.id === id) ?? null;
  return delayed(provider, options);
}

export async function getEvalOverview(options?: MockRequestOptions): Promise<EvalOverview> {
  return delayed(
    {
      scoreboard: evalScoreboard,
      comparisons: evalComparisons,
      recommendations: evalRecommendations,
      reports: evalReports,
    },
    options,
  );
}
