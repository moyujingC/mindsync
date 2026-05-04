import {
  bootstrapConsoleBrowserDeploymentRuntime,
} from "./app/consoleBrowserDeploymentRuntime";
import { getDefaultProvidersBrowserFetch } from "./app/consoleBrowserFetch";
import { renderConsoleApp } from "./renderConsoleApp";
import "./styles.css";

type TrialBootstrapGlobalScope = typeof globalThis & {
  __RELAYHUB_TRIAL_BOOTSTRAP_ERROR__?: string;
};

try {
  bootstrapConsoleBrowserDeploymentRuntime({
    mode: "browser-fetch",
    env: {
      RELAYHUB_PROVIDERS_RUNTIME_MODE: import.meta.env.RELAYHUB_PROVIDERS_RUNTIME_MODE,
      RELAYHUB_PROVIDERS_READONLY_BASE_URL: import.meta.env.RELAYHUB_PROVIDERS_READONLY_BASE_URL,
      RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
        import.meta.env.RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON,
      RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT:
        import.meta.env.RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT,
    },
    browserFetch: getDefaultProvidersBrowserFetch(),
  });
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown bootstrap error";
  console.error("RelayHub console trial bootstrap failed", error);
  (globalThis as TrialBootstrapGlobalScope).__RELAYHUB_TRIAL_BOOTSTRAP_ERROR__ = message;
}

renderConsoleApp(import.meta.env.BASE_URL);
