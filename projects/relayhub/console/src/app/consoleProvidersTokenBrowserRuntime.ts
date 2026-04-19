import type {
  ConsoleProvidersTokenDeploymentInput,
} from "./consoleProvidersTokenDeployment";
import type {
  ProvidersAuthTokenProvider,
  ProvidersAuthTokenSource,
  ProvidersAuthTokenSourceCompositionOptions,
  ProvidersAuthTokenSourceFactoryOptions,
} from "../services/providersAuthHeaders";

export type ConsoleProvidersTokenBrowserRuntimeOptionMode =
  | "default-disabled"
  | "provider"
  | "source"
  | "source-factory"
  | "source-composition"
  | "deployment-input";

export type ConsoleProvidersTokenBrowserRuntimeOption =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "provider";
      authTokenProvider?: ProvidersAuthTokenProvider;
    }
  | {
      mode: "source";
      authTokenSource?: ProvidersAuthTokenSource;
    }
  | {
      mode: "source-factory";
      authTokenSourceFactoryOptions?: ProvidersAuthTokenSourceFactoryOptions;
    }
  | {
      mode: "source-composition";
      authTokenSourceCompositionOptions?: ProvidersAuthTokenSourceCompositionOptions;
    }
  | {
      mode: "deployment-input";
      tokenDeploymentInput?: ConsoleProvidersTokenDeploymentInput;
    };

export function resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption(
  option: ConsoleProvidersTokenBrowserRuntimeOption = { mode: "default-disabled" },
): ConsoleProvidersTokenDeploymentInput | undefined {
  if (option.mode === "provider") {
    return {
      mode: "provider",
      authTokenProvider: option.authTokenProvider,
    };
  }

  if (option.mode === "source") {
    return {
      mode: "source",
      authTokenSource: option.authTokenSource,
    };
  }

  if (option.mode === "source-factory") {
    return {
      mode: "source-factory",
      authTokenSourceFactoryOptions: option.authTokenSourceFactoryOptions,
    };
  }

  if (option.mode === "source-composition") {
    return {
      mode: "source-composition",
      authTokenSourceCompositionOptions: option.authTokenSourceCompositionOptions,
    };
  }

  if (option.mode === "deployment-input") {
    return option.tokenDeploymentInput;
  }

  return undefined;
}
