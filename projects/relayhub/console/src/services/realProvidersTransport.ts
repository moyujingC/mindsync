import type { ProviderFilterSnapshot } from "../contracts";

type ProvidersReadonlyTransportScope = "collection" | "detail";

export interface ProvidersReadonlyTransportRequest {
  resource: "providers";
  scope: ProvidersReadonlyTransportScope;
  path: string;
  providerId?: string;
  filters?: ProviderFilterSnapshot;
  forceError?: boolean;
}

export interface ProvidersReadonlyTransportResponse {
  data: unknown;
  statusCode?: number;
  headers?: Record<string, string>;
}

export type ProvidersReadonlyTransport = (
  request: ProvidersReadonlyTransportRequest,
) => Promise<ProvidersReadonlyTransportResponse>;
