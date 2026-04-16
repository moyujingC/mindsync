import type { ProviderRecord } from "../models/console";
import type { ContractCollectionResponse, ContractDetailResponse } from "./base";

export type ProviderCollectionContract = ContractCollectionResponse<ProviderRecord>;
export type ProviderDetailContract = ContractDetailResponse<ProviderRecord>;
