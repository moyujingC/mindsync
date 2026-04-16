import type { EnvironmentRecord } from "../models/console";
import type { ContractCollectionResponse, ContractDetailResponse } from "./base";

export type EnvironmentCollectionContract = ContractCollectionResponse<EnvironmentRecord>;
export type EnvironmentDetailContract = ContractDetailResponse<EnvironmentRecord>;
