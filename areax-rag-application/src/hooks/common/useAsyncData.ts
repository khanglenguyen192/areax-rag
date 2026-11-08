import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncData<T> = {
  readonly data: T | undefined;
  readonly error: unknown;
  readonly isLoading: boolean;
  readonly refetch: () => Promise<void>;
  /** Replaces the loaded value, for example to append a streamed token. */
  readonly setData: (update: (previous: T | undefined) => T | undefined) => void;
};

type Settled<T> = {
  readonly load: (signal: AbortSignal) => Promise<T>;
  readonly data: T | undefined;
  readonly error: unknown;
};

async function loadInto<T>(
  load: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  commit: (settled: Settled<T>) => void,
): Promise<void> {
  try {
    const data = await load(signal);
    if (!signal.aborted) commit({ load, data, error: undefined });
  } catch (caught) {
    if (!signal.aborted) commit({ load, data: undefined, error: caught });
  }
}

/**
 * Runs `load` when `enabled` and whenever `load` changes, and exposes the result.
 *
 * It is generic: it receives the loader and knows nothing about the API. Data hooks in
 * `src/hooks/<feature>/` pass a loader that calls `lib/apiClient`. An in-flight request is
 * aborted when inputs change or the component unmounts, and a stale response is ignored.
 * A result that belongs to an older `load` is never exposed, so switching inputs shows the
 * loading state instead of the previous data.
 */
export function useAsyncData<T>(
  load: (signal: AbortSignal) => Promise<T>,
  enabled = true,
): AsyncData<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    await loadInto(load, controller.signal, setSettled);
  }, [load]);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    void loadInto(load, controller.signal, setSettled);
    return () => controller.abort();
  }, [enabled, load]);

  const setData = useCallback(
    (update: (previous: T | undefined) => T | undefined) => {
      setSettled((previous) => {
        const current = previous?.load === load ? previous : null;
        return { load, data: update(current?.data), error: undefined };
      });
    },
    [load],
  );

  const current = settled?.load === load ? settled : null;

  return {
    data: enabled ? current?.data : undefined,
    error: enabled ? current?.error : undefined,
    isLoading: enabled && current === null,
    refetch: run,
    setData,
  };
}
