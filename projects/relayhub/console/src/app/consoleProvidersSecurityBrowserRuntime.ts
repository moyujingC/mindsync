import {
  resolveProvidersAuthHeadersResolverFromDeploymentInput,
} from "./consoleProvidersAuthDeployment";
import {
  resolveProvidersAuthHeadersResolverFromTokenDeploymentInput,
} from "./consoleProvidersTokenDeployment";
import {
  resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption,
} from "./consoleProvidersAuthBrowserRuntime";
import {
  resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption,
} from "./consoleProvidersTokenBrowserRuntime";
import type {
  ConsoleProvidersAuthDeploymentInput,
} from "./consoleProvidersAuthDeployment";
import type {
  ConsoleProvidersTokenDeploymentInput,
} from "./consoleProvidersTokenDeployment";
import type {
  ConsoleProvidersAuthBrowserRuntimeOption,
} from "./consoleProvidersAuthBrowserRuntime";
import type {
  ConsoleProvidersTokenBrowserRuntimeOption,
} from "./consoleProvidersTokenBrowserRuntime";
import type { ProvidersAuthHeaderResolver } from "../services/providersAuthHeaders";

export type ConsoleProvidersSecurityBrowserRuntimeInputMode =
  | "default-disabled"
  | "auth-deployment-input"
  | "auth-browser-runtime-option"
  | "token-deployment-input"
  | "token-browser-runtime-option";

export type ConsoleProvidersSecurityBrowserRuntimeInput =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "auth-deployment-input";
      authDeploymentInput?: ConsoleProvidersAuthDeploymentInput;
    }
  | {
      mode: "auth-browser-runtime-option";
      authBrowserRuntimeOption?: ConsoleProvidersAuthBrowserRuntimeOption;
    }
  | {
      mode: "token-deployment-input";
      tokenDeploymentInput?: ConsoleProvidersTokenDeploymentInput;
    }
  | {
      mode: "token-browser-runtime-option";
      tokenBrowserRuntimeOption?: ConsoleProvidersTokenBrowserRuntimeOption;
    };

export function resolveProvidersAuthHeadersResolverFromSecurityBrowserRuntimeInput(
  input: ConsoleProvidersSecurityBrowserRuntimeInput = { mode: "default-disabled" },
): ProvidersAuthHeaderResolver | undefined {
  if (input.mode === "auth-deployment-input") {
    return resolveProvidersAuthHeadersResolverFromDeploymentInput(
      input.authDeploymentInput,
    );
  }

  if (input.mode === "auth-browser-runtime-option") {
    return resolveProvidersAuthHeadersResolverFromDeploymentInput(
      resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption(
        input.authBrowserRuntimeOption,
      ),
    );
  }

  if (input.mode === "token-deployment-input") {
    return resolveProvidersAuthHeadersResolverFromTokenDeploymentInput(
      input.tokenDeploymentInput,
    );
  }

  if (input.mode === "token-browser-runtime-option") {
    return resolveProvidersAuthHeadersResolverFromTokenDeploymentInput(
      resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption(
        input.tokenBrowserRuntimeOption,
      ),
    );
  }

  return undefined;
}
