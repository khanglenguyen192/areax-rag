import { useCallback, useState } from "react";

export type AsyncAction<Args extends unknown[], Result> = {
  readonly run: (...args: Args) => Promise<Result | undefined>;
  readonly isRunning: boolean;
  readonly error: unknown;
  readonly reset: () => void;
};

/**
 * Wraps a write so a view can show a pending state and the failure.
 *
 * `run` never rejects: it resolves to `undefined` when the action failed, and the cause is in
 * `error`. That keeps event handlers free of try/catch.
 */
export function useAsyncAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
): AsyncAction<Args, Result> {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const run = useCallback(
    async (...args: Args) => {
      setIsRunning(true);
      setError(undefined);
      try {
        return await action(...args);
      } catch (caught) {
        setError(caught);
        return undefined;
      } finally {
        setIsRunning(false);
      }
    },
    [action],
  );

  const reset = useCallback(() => setError(undefined), []);

  return { run, isRunning, error, reset };
}
