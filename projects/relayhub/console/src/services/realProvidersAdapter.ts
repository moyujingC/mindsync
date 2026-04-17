import type { ProviderRecordContract } from "../contracts";

// Default Providers readonly wire contract:
// - collection responses are { items: ProviderRecordContract[] }
// - detail responses are { item: ProviderRecordContract | null }
// Custom adapters may translate other backend shapes, but the default real-fetch trial expects this shape.
export interface ProvidersCollectionWirePayload {
  items: ProviderRecordContract[];
}

export interface ProviderDetailWirePayload {
  item: ProviderRecordContract | null;
}

function isProviderRecordArray(value: unknown): value is ProviderRecordContract[] {
  return Array.isArray(value);
}

export function adaptProvidersCollectionWirePayload(
  payload: unknown,
): ProvidersCollectionWirePayload {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("items" in payload) ||
    !isProviderRecordArray(payload.items)
  ) {
    throw new Error("Providers collection wire payload is invalid");
  }

  return {
    items: payload.items,
  };
}

export function adaptProviderDetailWirePayload(payload: unknown): ProviderDetailWirePayload {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("item" in payload) ||
    !(payload.item === null || typeof payload.item === "object")
  ) {
    throw new Error("Providers detail wire payload is invalid");
  }

  return {
    item: payload.item as ProviderRecordContract | null,
  };
}
