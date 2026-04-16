import * as mockApi from "../mocks/consoleApi";
import {
  adaptCollectionContractToReadonlyApiResponse,
  adaptDetailContractToReadonlyApiResponse,
  adaptOverviewContractToReadonlyApiResponse,
} from "./readonlyApiAdapters";
import type {
  DashboardOverview,
  EnvironmentRecord,
  EvalComparison,
  EvalOverview,
  EvalRecommendation,
  EvalReport,
  EvalScoreRow,
  EvalScoreboard,
  MetricsSnapshot,
  MockRequestOptions,
  ProviderFilters,
  ProviderRecord,
  RouteRecord,
  RunRecord,
} from "../models/console";
import type {
  DashboardDecisionContract,
  DashboardOverviewContract,
  DashboardOverviewPayloadContract,
  DashboardOverviewReadonlyApiResponse,
  DashboardRiskContract,
  ContractMetricsSnapshot,
  ContractRouteRecord,
  ContractRunRecord,
  EnvironmentCollectionContract,
  EnvironmentCollectionReadonlyApiResponse,
  EnvironmentDetailContract,
  EnvironmentDetailReadonlyApiResponse,
  EnvironmentRecordContract,
  EvalOverviewContract,
  EvalOverviewPayloadContract,
  EvalOverviewReadonlyApiResponse,
  ProviderModelContract,
  ProviderCollectionContract,
  ProviderCollectionReadonlyApiResponse,
  ProviderDetailContract,
  ProviderDetailReadonlyApiResponse,
  ProviderRecordContract,
} from "../contracts";

function mapMetricsSnapshot(snapshot: ContractMetricsSnapshot): MetricsSnapshot {
  return { ...snapshot };
}

function mapRunRecord(record: ContractRunRecord): RunRecord {
  return { ...record };
}

function mapRouteRecord(record: ContractRouteRecord): RouteRecord {
  return { ...record };
}

function mapEnvironmentRecord(record: EnvironmentRecordContract): EnvironmentRecord {
  return {
    ...record,
    policySummary: [...record.policySummary],
    routes: record.routes.map(mapRouteRecord),
    metrics: mapMetricsSnapshot(record.metrics),
    runs: record.runs.map(mapRunRecord),
  };
}

function mapDashboardDecision(decision: DashboardDecisionContract) {
  return { ...decision };
}

function mapDashboardRisk(risk: DashboardRiskContract) {
  return { ...risk };
}

function mapDashboardOverview(overview: DashboardOverviewPayloadContract): DashboardOverview {
  return {
    environments: overview.environments.map(mapEnvironmentRecord),
    decisions: overview.decisions.map(mapDashboardDecision),
    risks: overview.risks.map(mapDashboardRisk),
    metrics: mapMetricsSnapshot(overview.metrics),
    recentRuns: overview.recentRuns.map(mapRunRecord),
  };
}

function mapProviderModel(model: ProviderModelContract) {
  return { ...model };
}

function mapProviderRecord(record: ProviderRecordContract): ProviderRecord {
  return {
    ...record,
    availableEnvironments: [...record.availableEnvironments],
    models: record.models.map(mapProviderModel),
    metrics: record.metrics ? mapMetricsSnapshot(record.metrics) : null,
  };
}

function mapEvalScoreRow(row: EvalScoreRow): EvalScoreRow {
  return { ...row };
}

function mapEvalScoreboard(scoreboard: EvalScoreboard): EvalScoreboard {
  return {
    coding: scoreboard.coding.map(mapEvalScoreRow),
    therapy: scoreboard.therapy.map(mapEvalScoreRow),
  };
}

function mapEvalComparison(comparison: EvalComparison): EvalComparison {
  return { ...comparison };
}

function mapEvalRecommendation(recommendation: EvalRecommendation): EvalRecommendation {
  return { ...recommendation };
}

function mapEvalReport(report: EvalReport): EvalReport {
  return { ...report };
}

function mapEvalOverview(overview: EvalOverviewPayloadContract): EvalOverview {
  return {
    scoreboard: mapEvalScoreboard(overview.scoreboard),
    comparisons: overview.comparisons.map(mapEvalComparison),
    recommendations: overview.recommendations.map(mapEvalRecommendation),
    reports: overview.reports.map(mapEvalReport),
  };
}

export function getDashboardOverviewRaw(
  options?: MockRequestOptions,
): Promise<DashboardOverviewContract> {
  return mockApi.getDashboardOverview(options);
}

export function getDashboardOverviewReadonlyApiResponse(
  options?: MockRequestOptions,
): Promise<DashboardOverviewReadonlyApiResponse> {
  return getDashboardOverviewRaw(options).then(adaptOverviewContractToReadonlyApiResponse);
}

export function getDashboardOverview(options?: MockRequestOptions): Promise<DashboardOverview> {
  return getDashboardOverviewRaw(options).then((response) => mapDashboardOverview(response.overview));
}

export function listEnvironmentsRaw(
  options?: MockRequestOptions,
): Promise<EnvironmentCollectionContract> {
  return mockApi.listEnvironments(options);
}

export function listEnvironmentsReadonlyApiResponse(
  options?: MockRequestOptions,
): Promise<EnvironmentCollectionReadonlyApiResponse> {
  return listEnvironmentsRaw(options).then(adaptCollectionContractToReadonlyApiResponse);
}

export function listEnvironments(options?: MockRequestOptions): Promise<EnvironmentRecord[]> {
  return listEnvironmentsRaw(options).then((response) => response.items.map(mapEnvironmentRecord));
}

export function getEnvironmentRaw(
  id: string,
  options?: MockRequestOptions,
): Promise<EnvironmentDetailContract> {
  return mockApi.getEnvironment(id, options);
}

export function getEnvironmentReadonlyApiResponse(
  id: string,
  options?: MockRequestOptions,
): Promise<EnvironmentDetailReadonlyApiResponse> {
  return getEnvironmentRaw(id, options).then(adaptDetailContractToReadonlyApiResponse);
}

export function getEnvironment(
  id: string,
  options?: MockRequestOptions,
): Promise<EnvironmentRecord | null> {
  return getEnvironmentRaw(id, options).then((response) =>
    response.item ? mapEnvironmentRecord(response.item) : null,
  );
}

export function listProvidersRaw(
  filters: ProviderFilters = {},
  options?: MockRequestOptions,
): Promise<ProviderCollectionContract> {
  return mockApi.listProviders(filters, options);
}

export function listProvidersReadonlyApiResponse(
  filters: ProviderFilters = {},
  options?: MockRequestOptions,
): Promise<ProviderCollectionReadonlyApiResponse> {
  return listProvidersRaw(filters, options).then(adaptCollectionContractToReadonlyApiResponse);
}

export function listProviders(
  filters: ProviderFilters = {},
  options?: MockRequestOptions,
): Promise<ProviderRecord[]> {
  return listProvidersRaw(filters, options).then((response) => response.items.map(mapProviderRecord));
}

export function getProviderRaw(
  id: string,
  options?: MockRequestOptions,
): Promise<ProviderDetailContract> {
  return mockApi.getProvider(id, options);
}

export function getProviderReadonlyApiResponse(
  id: string,
  options?: MockRequestOptions,
): Promise<ProviderDetailReadonlyApiResponse> {
  return getProviderRaw(id, options).then(adaptDetailContractToReadonlyApiResponse);
}

export function getProvider(
  id: string,
  options?: MockRequestOptions,
): Promise<ProviderRecord | null> {
  return getProviderRaw(id, options).then((response) =>
    response.item ? mapProviderRecord(response.item) : null,
  );
}

export function getEvalOverviewRaw(
  options?: MockRequestOptions,
): Promise<EvalOverviewContract> {
  return mockApi.getEvalOverview(options);
}

export function getEvalOverviewReadonlyApiResponse(
  options?: MockRequestOptions,
): Promise<EvalOverviewReadonlyApiResponse> {
  return getEvalOverviewRaw(options).then(adaptOverviewContractToReadonlyApiResponse);
}

export function getEvalOverview(options?: MockRequestOptions): Promise<EvalOverview> {
  return getEvalOverviewRaw(options).then((response) => mapEvalOverview(response.overview));
}
