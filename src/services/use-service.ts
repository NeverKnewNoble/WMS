"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./http";

export type ServiceState<T> = {
  data:    T | null;
  loading: boolean;
  error:   ApiError | null;
  refetch: () => void;
};

/**
 * Tiny client-side data hook. Calls `loader` on mount (and when `deps`
 * change), tracks loading + the last `ApiError`, and exposes a
 * `refetch()` for manual re-runs (e.g. after a mutation).
 *
 * The toast is already shown by the service layer, so consumers only
 * need to render `data` / `loading` / `error.message` — they don't have
 * to call `toast.error` themselves.
 *
 * Race-safe: if the component re-runs `refetch` before the previous
 * promise settles, only the latest result lands in state.
 */
export function useService<T>(
  loader: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): ServiceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const requestId = useRef(0);

  const run = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    loader()
      .then((res) => {
        if (id !== requestId.current) return;
        setData(res);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        if (err instanceof ApiError) setError(err);
        else setError(new ApiError(0, err instanceof Error ? err.message : String(err)));
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run };
}
