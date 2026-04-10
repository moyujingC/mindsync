import { pushApiDebugTrace } from "./debugTrace";

export class AimandalaApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "AimandalaApiError";
  }
}

function summarizeDebugValue(value: unknown): unknown {
  if (value == null) {
    return value;
  }

  if (value instanceof FormData) {
    return Array.from(value.entries()).map(([key, fieldValue]) => ({
      key,
      value:
        typeof fieldValue === "string"
          ? fieldValue
          : {
              kind: "file",
              name: fieldValue.name,
              type: fieldValue.type,
              size: fieldValue.size,
            },
    }));
  }

  if (typeof value === "string") {
    return value.length > 400 ? `${value.slice(0, 400)}...` : value;
  }

  if (typeof value !== "object") {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const startedAt = Date.now();
  const traceId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${startedAt}-${Math.random().toString(16).slice(2)}`;
  const method = options?.method ?? "GET";
  const requestSummary = summarizeDebugValue(options?.body);

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      pushApiDebugTrace({
        id: traceId,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        phase: "error",
        method,
        url,
        requestSummary,
        responseSummary: summarizeDebugValue(errorData),
        errorMessage:
          (errorData as { detail?: string; error?: string } | null)?.detail ||
          (errorData as { detail?: string; error?: string } | null)?.error ||
          `HTTP error: ${response.status}`,
        statusCode: response.status,
      });
      throw new AimandalaApiError(
        (errorData as { detail?: string; error?: string } | null)?.detail ||
          (errorData as { detail?: string; error?: string } | null)?.error ||
          `HTTP error: ${response.status}`,
        response.status,
        errorData,
      );
    }

    const json = (await response.json()) as T;
    pushApiDebugTrace({
      id: traceId,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      phase: "success",
      method,
      url,
      requestSummary,
      responseSummary: summarizeDebugValue(json),
      statusCode: response.status,
    });
    return json;
  } catch (error) {
    if (error instanceof AimandalaApiError) {
      throw error;
    }
    pushApiDebugTrace({
      id: traceId,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      phase: "error",
      method,
      url,
      requestSummary,
      errorMessage: error instanceof Error ? error.message : "Network error occurred",
    });
    throw new AimandalaApiError(
      error instanceof Error ? error.message : "Network error occurred",
    );
  }
}
