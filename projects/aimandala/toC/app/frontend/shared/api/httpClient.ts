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

function resolveErrorMessage(errorData: unknown, fallback: string): string {
  const detail = (errorData as { detail?: unknown; error?: unknown } | null)?.detail;
  const error = (errorData as { detail?: unknown; error?: unknown } | null)?.error;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (detail && typeof detail === "object") {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = resolveErrorMessage(errorData, `HTTP error: ${response.status}`);
      throw new AimandalaApiError(
        errorMessage,
        response.status,
        errorData,
      );
    }

    const json = (await response.json()) as T;
    return json;
  } catch (error) {
    if (error instanceof AimandalaApiError) {
      throw error;
    }
    throw new AimandalaApiError(
      error instanceof Error ? error.message : "Network error occurred",
    );
  }
}
