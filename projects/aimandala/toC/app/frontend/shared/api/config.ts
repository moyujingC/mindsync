export const DEFAULT_AIMANDALA_API_BASE_URL = "http://localhost:8000";

export function getAimandalaApiBaseUrl(): string {
  if (typeof process !== "undefined") {
    const fromEnv =
      process.env.AIMANDALA_API_BASE_URL || process.env.NEXT_PUBLIC_AIMANDALA_API_BASE_URL;
    if (fromEnv) {
      return fromEnv;
    }
  }

  return DEFAULT_AIMANDALA_API_BASE_URL;
}
