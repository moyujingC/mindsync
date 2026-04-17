import {
  resolveProvidersAuthHeadersResolverFromDeploymentInput,
} from "./consoleProvidersAuthDeployment";
import {
  resolveProvidersAuthHeadersResolverFromTokenDeploymentInput,
} from "./consoleProvidersTokenDeployment";
import {
  resolveProvidersAuthHeadersResolverFromSecurityBrowserRuntimeInput,
} from "./consoleProvidersSecurityBrowserRuntime";
import type {
  ConsoleProvidersAuthDeploymentInput,
} from "./consoleProvidersAuthDeployment";
import type {
  ConsoleProvidersTokenDeploymentInput,
} from "./consoleProvidersTokenDeployment";
import type {
  ConsoleProvidersSecurityBrowserRuntimeInput,
} from "./consoleProvidersSecurityBrowserRuntime";
import type { ProvidersAuthHeaderResolver } from "../services/providersAuthHeaders";

export type ConsoleProvidersSecurityDeploymentInputMode =
  | "default-disabled"
  | "auth-deployment-input"
  | "token-deployment-input"
  | "security-browser-runtime-input";

export type ConsoleProvidersSecurityDeploymentInput =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "auth-deployment-input";
      authDeploymentInput?: ConsoleProvidersAuthDeploymentInput;
    }
  | {
      mode: "token-deployment-input";
      tokenDeploymentInput?: ConsoleProvidersTokenDeploymentInput;
    }
  | {
      mode: "security-browser-runtime-input";
      securityBrowserRuntimeInput?: ConsoleProvidersSecurityBrowserRuntimeInput;
    };

export function resolveProvidersAuthHeadersResolverFromSecurityDeploymentInput(
  input: ConsoleProvidersSecurityDeploymentInput = { mode: "default-disabled" },
): ProvidersAuthHeaderResolver | undefined {
  if (input.mode === "auth-deployment-input") {
    return resolveProvidersAuthHeadersResolverFromDeploymentInput(
      input.authDeploymentInput,
    );
  }

  if (input.mode === "token-deployment-input") {
    return resolveProvidersAuthHeadersResolverFromTokenDeploymentInput(
      input.tokenDeploymentInput,
    );
  }

  if (input.mode === "security-browser-runtime-input") {
    return resolveProvidersAuthHeadersResolverFromSecurityBrowserRuntimeInput(
      input.securityBrowserRuntimeInput,
    );
  }

  return undefined;
}
