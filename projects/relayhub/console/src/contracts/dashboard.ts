import type { ContractOverviewResponse, ReadonlyApiResponse } from "./base";
import type {
  ContractMetricsSnapshot,
  ContractRunRecord,
  EnvironmentRecordContract,
} from "./environments";

export interface DashboardDecisionContract {
  title: string;
  type: string;
  target: string;
  reason: string;
  updatedAt: string;
}

export interface DashboardRiskContract {
  title: string;
  level: string;
  environment: string;
  note: string;
}

export interface DashboardOverviewPayloadContract {
  environments: EnvironmentRecordContract[];
  decisions: DashboardDecisionContract[];
  risks: DashboardRiskContract[];
  metrics: ContractMetricsSnapshot;
  recentRuns: ContractRunRecord[];
}

export type DashboardOverviewContract = ContractOverviewResponse<DashboardOverviewPayloadContract>;
export type DashboardOverviewReadonlyApiResponse =
  ReadonlyApiResponse<DashboardOverviewPayloadContract>;
