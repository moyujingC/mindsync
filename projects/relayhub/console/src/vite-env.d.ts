/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly RELAYHUB_PROVIDERS_RUNTIME_MODE?: string;
  readonly RELAYHUB_PROVIDERS_READONLY_BASE_URL?: string;
  readonly RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON?: string;
  readonly RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT?: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
