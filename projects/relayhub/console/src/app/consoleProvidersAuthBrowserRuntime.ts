import type {
  ConsoleProvidersAuthDeploymentInput,
} from "./consoleProvidersAuthDeployment";
import type {
  ProvidersAuthHeaderResolver,
  ProvidersAuthHeadersSource,
  ProvidersAuthHeadersSourceCompositionOptions,
  ProvidersAuthHeadersSourceFactoryOptions,
} from "../services/providersAuthHeaders";

export type ConsoleProvidersAuthBrowserRuntimeOptionMode =
  | "default-disabled"
  | "resolver"
  | "source"
  | "source-factory"
  | "source-composition"
  | "deployment-input";

export type ConsoleProvidersAuthBrowserRuntimeOption =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "resolver";
      authHeadersResolver?: ProvidersAuthHeaderResolver;
    }
  | {
      mode: "source";
      authHeadersSource?: ProvidersAuthHeadersSource;
    }
  | {
      mode: "source-factory";
      authHeadersSourceFactoryOptions?: ProvidersAuthHeadersSourceFactoryOptions;
    }
  | {
      mode: "source-composition";
      authHeadersSourceCompositionOptions?: ProvidersAuthHeadersSourceCompositionOptions;
    }
  | {
      mode: "deployment-input";
      authDeploymentInput?: ConsoleProvidersAuthDeploymentInput;
    };

export function resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption(
  option: ConsoleProvidersAuthBrowserRuntimeOption = { mode: "default-disabled" },
): ConsoleProvidersAuthDeploymentInput | undefined {
  if (option.mode === "resolver") {
    return {
      mode: "resolver",
      authHeadersResolver: option.authHeadersResolver,
    };
  }

  if (option.mode === "source") {
    return {
      mode: "source",
      authHeadersSource: option.authHeadersSource,
    };
  }

  if (option.mode === "source-factory") {
    return {
      mode: "source-factory",
      authHeadersSourceFactoryOptions: option.authHeadersSourceFactoryOptions,
    };
  }

  if (option.mode === "source-composition") {
    return {
      mode: "source-composition",
      authHeadersSourceCompositionOptions: option.authHeadersSourceCompositionOptions,
    };
  }

  if (option.mode === "deployment-input") {
    return option.authDeploymentInput;
  }

  return undefined;
}
