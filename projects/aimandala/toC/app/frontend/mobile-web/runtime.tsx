import { useEffect, useState } from "react";

import { MobileWebApp } from "./app";
import {
  resolveMobileWebRouteProps,
  type MobileWebRouteInput,
} from "./router-plan";
import type { MobileWebAppProps } from "./app";

export interface MobileWebRouteLoaderState {
  loading: boolean;
  error: string | null;
  props: MobileWebAppProps | null;
}

export function useMobileWebRouteLoader(
  input: MobileWebRouteInput,
): MobileWebRouteLoaderState {
  const [state, setState] = useState<MobileWebRouteLoaderState>({
    loading: true,
    error: null,
    props: null,
  });

  useEffect(() => {
    let cancelled = false;

    setState({
      loading: true,
      error: null,
      props: null,
    });

    resolveMobileWebRouteProps(input)
      .then((props) => {
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          error: null,
          props,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load mobile web route",
          props: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [input]);

  return state;
}

export interface MobileWebRuntimeProps {
  input: MobileWebRouteInput;
  loadingFallback?: React.ReactNode;
  errorFallback?: (message: string) => React.ReactNode;
}

export function MobileWebRuntime({
  input,
  loadingFallback = "Loading mobile web route...",
  errorFallback,
}: MobileWebRuntimeProps) {
  const { loading, error, props } = useMobileWebRouteLoader(input);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (error) {
    if (errorFallback) {
      return <>{errorFallback(error)}</>;
    }
    return <>{error}</>;
  }

  if (!props) {
    return <>Missing mobile web props</>;
  }

  return <MobileWebApp {...props} />;
}
