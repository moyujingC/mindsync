export type HealthState = "healthy" | "degraded" | "risk" | "idle";
export type ProviderKind = "第三方中转" | "国产模型" | "免费国外 API";
export type TransparencyState = "完整" | "部分缺失" | "暂无";
export type MockResource = "dashboard" | "environments" | "providers" | "eval";
export type MockScope = "overview" | "collection" | "detail";
export type MockStatus = "ready" | "empty" | "not-found";

export type EnvironmentTab = "overview" | "providers" | "routes" | "usage" | "policies" | "runs";
export type EvalTab = "scoreboard" | "comparisons" | "recommendations" | "reports";
export type HealthFilter = "全部" | HealthState;

export interface MetricsSnapshot {
  requests: number;
  tokens: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
  cost: number;
}

export interface RunRecord {
  id: string;
  name: string;
  type: string;
  status: HealthState;
  startedAt: string;
  environment: string;
}

export interface RouteRecord {
  taskType: string;
  model: string;
  provider: string;
  note: string;
}

export interface EnvironmentRecord {
  id: string;
  name: string;
  mode: string;
  purpose: string;
  providerScope: string;
  status: HealthState;
  providerCount: number;
  requests24h: number;
  successRate: number;
  recentStatus: string;
  targetNote: string;
  recommendation: string;
  policySummary: string[];
  routes: RouteRecord[];
  metrics: MetricsSnapshot;
  runs: RunRecord[];
}

export interface ProviderRecord {
  id: string;
  name: string;
  kind: ProviderKind;
  availableEnvironments: string[];
  health: HealthState;
  transparency: TransparencyState;
  errorRate: number;
  p95Latency: number;
  description: string;
  recommendation: string;
  recommendationNote: string;
  models: Array<{ name: string; useCase: string }>;
  metrics: MetricsSnapshot | null;
}

export interface DashboardDecision {
  title: string;
  type: string;
  target: string;
  reason: string;
  updatedAt: string;
}

export interface DashboardRisk {
  title: string;
  level: string;
  environment: string;
  note: string;
}

export interface DashboardOverview {
  environments: EnvironmentRecord[];
  decisions: DashboardDecision[];
  risks: DashboardRisk[];
  metrics: MetricsSnapshot;
  recentRuns: RunRecord[];
}

export interface EvalScoreRow {
  task: string;
  contender: string;
  quality: number;
  stability: number;
  efficiency: number;
  conclusion: string;
}

export interface EvalScoreboard {
  coding: EvalScoreRow[];
  therapy: EvalScoreRow[];
}

export interface EvalComparison {
  title: string;
  task: string;
  difference: string;
  recommendation: string;
}

export interface EvalRecommendation {
  category: string;
  headline: string;
  detail: string;
}

export interface EvalReport {
  name: string;
  status: string;
  period: string;
  note: string;
}

export interface EvalOverview {
  scoreboard: EvalScoreboard;
  comparisons: EvalComparison[];
  recommendations: EvalRecommendation[];
  reports: EvalReport[];
}

export interface MockResponseMeta {
  source: "local-mock";
  generatedAt: string;
  version: "v1";
  resource: MockResource;
  scope: MockScope;
  status: MockStatus;
  filters?: ProviderFilters;
}

export interface CollectionResponse<T> {
  meta: MockResponseMeta;
  items: T[];
}

export interface DetailResponse<T> {
  meta: MockResponseMeta;
  item: T | null;
}

export interface OverviewResponse<T> {
  meta: MockResponseMeta;
  overview: T;
}

export interface ProviderFilters {
  kind?: ProviderKind | "全部";
  environment?: string;
  health?: HealthFilter;
  transparency?: TransparencyState | "全部";
}

export interface MockRequestOptions {
  forceError?: boolean;
}
