import { describe, expect, it } from "vitest";
import type {
  ContractCollectionResponse,
  ContractDetailResponse,
  ContractOverviewResponse,
} from "../contracts";
import {
  adaptCollectionContractToReadonlyApiResponse,
  adaptDetailContractToReadonlyApiResponse,
  adaptOverviewContractToReadonlyApiResponse,
} from "../services/readonlyApiAdapters";

describe("readonlyApiAdapters", () => {
  it("adapts overview responses into meta + data shape", () => {
    const response: ContractOverviewResponse<{ title: string }> = {
      meta: {
        source: "local-mock",
        generatedAt: "2026-04-16T00:00:00+08:00",
        version: "v1",
        resource: "dashboard",
        scope: "overview",
        status: "ready",
      },
      overview: {
        title: "overview",
      },
    };

    expect(adaptOverviewContractToReadonlyApiResponse(response)).toEqual({
      meta: response.meta,
      data: response.overview,
    });
  });

  it("adapts collection responses into meta + data shape", () => {
    const response: ContractCollectionResponse<{ id: string }, { environment: string }> = {
      meta: {
        source: "local-mock",
        generatedAt: "2026-04-16T00:00:00+08:00",
        version: "v1",
        resource: "providers",
        scope: "collection",
        status: "ready",
        filters: {
          environment: "评测版",
        },
      },
      items: [{ id: "provider-1" }],
    };

    expect(adaptCollectionContractToReadonlyApiResponse(response)).toEqual({
      meta: response.meta,
      data: response.items,
    });
  });

  it("adapts detail responses into meta + data shape", () => {
    const response: ContractDetailResponse<{ id: string }> = {
      meta: {
        source: "local-mock",
        generatedAt: "2026-04-16T00:00:00+08:00",
        version: "v1",
        resource: "providers",
        scope: "detail",
        status: "not-found",
      },
      item: null,
    };

    expect(adaptDetailContractToReadonlyApiResponse(response)).toEqual({
      meta: response.meta,
      data: response.item,
    });
  });
});
