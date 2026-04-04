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

export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new AimandalaApiError(
        (errorData as { detail?: string; error?: string } | null)?.detail ||
          (errorData as { detail?: string; error?: string } | null)?.error ||
          `HTTP error: ${response.status}`,
        response.status,
        errorData,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AimandalaApiError) {
      throw error;
    }
    throw new AimandalaApiError(
      error instanceof Error ? error.message : "Network error occurred",
    );
  }
}
