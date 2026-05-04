import { DependencyList, useEffect, useState } from "react";

type AsyncStatus = "loading" | "success" | "empty" | "not-found" | "error";

interface AsyncResource<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

function resolveStatus<T>(value: T | null): AsyncStatus {
  if (value === null) {
    return "not-found";
  }

  if (Array.isArray(value) && value.length === 0) {
    return "empty";
  }

  return "success";
}

export function useAsyncResource<T>(
  loader: () => Promise<T | null>,
  dependencies: DependencyList,
): AsyncResource<T> {
  const [resource, setResource] = useState<AsyncResource<T>>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    setResource({
      status: "loading",
      data: null,
      error: null,
    });

    loader()
      .then((value) => {
        if (!active) {
          return;
        }

        setResource({
          status: resolveStatus(value),
          data: value,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unknown page data error";
        setResource({
          status: "error",
          data: null,
          error: message,
        });
      });

    return () => {
      active = false;
    };
  }, dependencies);

  return resource;
}
