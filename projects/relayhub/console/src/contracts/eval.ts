import type { ContractOverviewResponse } from "./base";

export interface EvalScoreRowContract {
  task: string;
  contender: string;
  quality: number;
  stability: number;
  efficiency: number;
  conclusion: string;
}

export interface EvalScoreboardContract {
  coding: EvalScoreRowContract[];
  therapy: EvalScoreRowContract[];
}

export interface EvalComparisonContract {
  title: string;
  task: string;
  difference: string;
  recommendation: string;
}

export interface EvalRecommendationContract {
  category: string;
  headline: string;
  detail: string;
}

export interface EvalReportContract {
  name: string;
  status: string;
  period: string;
  note: string;
}

export interface EvalOverviewPayloadContract {
  scoreboard: EvalScoreboardContract;
  comparisons: EvalComparisonContract[];
  recommendations: EvalRecommendationContract[];
  reports: EvalReportContract[];
}

export type EvalOverviewContract = ContractOverviewResponse<EvalOverviewPayloadContract>;
