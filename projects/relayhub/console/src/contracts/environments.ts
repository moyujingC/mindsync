import type { ContractCollectionResponse, ContractDetailResponse } from "./base";

export type ContractHealthState = "healthy" | "degraded" | "risk" | "idle";

export interface ContractMetricsSnapshot {
  requests: number;
  tokens: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
  cost: number;
}

export interface ContractRunRecord {
  id: string;
  name: string;
  type: string;
  status: ContractHealthState;
  startedAt: string;
  environment: string;
}

export interface ContractRouteRecord {
  taskType: string;
  model: string;
  provider: string;
  note: string;
}

export interface EnvironmentRecordContract {
  id: string;
  name: string;
  mode: string;
  purpose: string;
  providerScope: string;
  status: ContractHealthState;
  providerCount: number;
  requests24h: number;
  successRate: number;
  recentStatus: string;
  targetNote: string;
  recommendation: string;
  policySummary: string[];
  routes: ContractRouteRecord[];
  metrics: ContractMetricsSnapshot;
  runs: ContractRunRecord[];
}

export type EnvironmentCollectionContract = ContractCollectionResponse<EnvironmentRecordContract>;
export type EnvironmentDetailContract = ContractDetailResponse<EnvironmentRecordContract>;
