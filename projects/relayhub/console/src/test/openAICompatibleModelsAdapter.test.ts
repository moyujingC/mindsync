import { describe, expect, it } from "vitest";
import {
  adaptOpenAICompatibleModelsListWirePayload,
  filterOpenAICompatibleProviderRecords,
  mapOpenAICompatibleModelToProviderRecord,
} from "../services/openAICompatibleModelsAdapter";
import {
  createOpenAICompatibleModelWireRecord,
  createOpenAICompatibleModelsListPayload,
} from "./providersReadonlyContractFixtures";

describe("openAICompatibleModelsAdapter", () => {
  it("adapts a valid /models payload", () => {
    const payload = adaptOpenAICompatibleModelsListWirePayload(
      createOpenAICompatibleModelsListPayload(),
    );

    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]?.id).toBe("gpt-5.3-codex");
  });

  it("throws a clear error for invalid /models payload", () => {
    expect(() => adaptOpenAICompatibleModelsListWirePayload({ items: [] })).toThrow(
      "OpenAI-compatible models wire payload is invalid",
    );
  });

  it("maps a model record into the provider contract shape", () => {
    const mapped = mapOpenAICompatibleModelToProviderRecord(
      createOpenAICompatibleModelWireRecord({
        id: "gpt-5.4-mini",
        root: "gpt-5.4-mini",
        owned_by: "gpt-5.4-mini",
      }),
    );

    expect(mapped).toMatchObject({
      id: "gpt-5.4-mini",
      name: "gpt-5.4-mini",
      kind: "第三方中转",
      availableEnvironments: ["开发版"],
      health: "healthy",
      transparency: "部分缺失",
      errorRate: 0,
      p95Latency: 0,
      metrics: null,
    });
    expect(mapped.models).toEqual([
      { name: "gpt-5.4-mini", useCase: "OpenAI-compatible model catalog" },
    ]);
  });

  it("filters mapped provider records with the existing provider filter semantics", () => {
    const items = [
      mapOpenAICompatibleModelToProviderRecord(createOpenAICompatibleModelWireRecord()),
    ];

    expect(filterOpenAICompatibleProviderRecords(items, { kind: "第三方中转" })).toHaveLength(1);
    expect(filterOpenAICompatibleProviderRecords(items, { environment: "开发版" })).toHaveLength(1);
    expect(filterOpenAICompatibleProviderRecords(items, { kind: "国产模型" })).toHaveLength(0);
  });
});
