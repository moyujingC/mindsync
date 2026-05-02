import {
  entryResolutionSchema,
  modelCatalogResponseSchema,
  modelEntrySchema,
  relayAccessSummarySchema,
} from "@/lib/schemas";
import { z } from "zod";

const controlPlaneBaseUrl = process.env.NEXT_PUBLIC_RELAYHUB_CONTROL_PLANE_BASE_URL?.trim() || "/api/control-plane";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function request<T>(path: string, init: RequestInit, schema: z.ZodSchema<T>): Promise<T> {
  const response = await fetch(`${controlPlaneBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new ApiError(
      typeof payload?.message === "string" ? payload.message : `请求失败（${response.status}）`,
      response.status,
    );
  }

  return schema.parse(payload);
}

export async function listModelEntries() {
  return request("/models", { method: "GET" }, z.array(modelEntrySchema));
}

export async function listEntryBindingResolutions() {
  return request("/entry-bindings/resolutions", { method: "GET" }, z.array(entryResolutionSchema));
}

export async function getRelayAccessSummary() {
  return request("/relay-access", { method: "GET" }, relayAccessSummarySchema);
}

export async function patchRelayAccess(relayToken: string) {
  return request(
    "/relay-access",
    {
      method: "PATCH",
      body: JSON.stringify({ relayToken }),
    },
    relayAccessSummarySchema,
  );
}

export async function patchEntryBinding(entryId: string, payload: Record<string, unknown>) {
  return request(`/entry-bindings/${entryId}`, { method: "PATCH", body: JSON.stringify(payload) }, z.any());
}

export async function createModelEntry(payload: Record<string, unknown>) {
  return request("/models", { method: "POST", body: JSON.stringify(payload) }, modelEntrySchema);
}

export async function patchModelEntry(id: string, payload: Record<string, unknown>) {
  return request(`/models/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, modelEntrySchema);
}

export async function deleteModelEntry(id: string) {
  const response = await fetch(`${controlPlaneBaseUrl}/models/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!response.ok && response.status !== 204) {
    const payload = await parseJson(response);
    throw new ApiError(
      typeof payload?.message === "string" ? payload.message : `删除失败（${response.status}）`,
      response.status,
    );
  }
}

export async function testModelEntry(id: string) {
  return request(`/models/${id}/test`, { method: "POST", body: JSON.stringify({}) }, modelEntrySchema);
}

export async function getModelCatalog(id: string) {
  return request(`/models/${id}/catalog`, { method: "GET" }, modelCatalogResponseSchema);
}
