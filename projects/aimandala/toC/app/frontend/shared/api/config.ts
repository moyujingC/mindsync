export const DEFAULT_AIMANDALA_API_BASE_URL = "http://127.0.0.1:8100";

interface ProcessLikeEnv {
  AIMANDALA_API_BASE_URL?: string;
  NEXT_PUBLIC_AIMANDALA_API_BASE_URL?: string;
}

interface ImportMetaEnvLike extends ProcessLikeEnv {
  VITE_AIMANDALA_API_BASE_URL?: string;
}

export function getAimandalaApiBaseUrl(): string {
  const fromImportMeta = (
    import.meta as ImportMeta & { env?: ImportMetaEnvLike }
  ).env?.VITE_AIMANDALA_API_BASE_URL;

  if (fromImportMeta) {
    return fromImportMeta;
  }

  const processLike = globalThis as typeof globalThis & {
    process?: {
      env?: ProcessLikeEnv;
    };
  };

  const fromProcess =
    processLike.process?.env?.AIMANDALA_API_BASE_URL ||
    processLike.process?.env?.NEXT_PUBLIC_AIMANDALA_API_BASE_URL;

  if (fromProcess) {
    return fromProcess;
  }

  return DEFAULT_AIMANDALA_API_BASE_URL;
}
