import {
  bootstrapConsoleBrowserDeploymentRuntime,
} from "./app/consoleBrowserDeploymentRuntime";
import { getDefaultProvidersBrowserFetch } from "./app/consoleBrowserFetch";
import { renderConsoleApp } from "./renderConsoleApp";
import "./styles.css";

bootstrapConsoleBrowserDeploymentRuntime({
  mode: "browser-fetch",
  env: {
    RELAYHUB_PROVIDERS_RUNTIME_MODE: import.meta.env.RELAYHUB_PROVIDERS_RUNTIME_MODE,
    RELAYHUB_PROVIDERS_READONLY_BASE_URL: import.meta.env.RELAYHUB_PROVIDERS_READONLY_BASE_URL,
    RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
      import.meta.env.RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON,
  },
  browserFetch: getDefaultProvidersBrowserFetch(),
});

renderConsoleApp(import.meta.env.BASE_URL);
