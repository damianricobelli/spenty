import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

/**
 * A wrapper around `useMutation` intended to centralize common side effects
 * and make it easier to coordinate internal component or application state
 * during a mutation lifecycle.
 *
 * Useful when:
 * - you need to consistently invalidate queries after a mutation
 * - you want to control local/UI state (flags, loaders, toasts, analytics, etc.)
 *   via `onSuccess`, `onError`, or `onSettled` callbacks
 * - you want to extend `useMutation` behavior without duplicating logic
 *
 * This hook does NOT aim to replace mutation business logic.
 * Instead, it provides a single place to orchestrate side effects
 * related to application or component state.
 *
 * @param options Standard `useMutation` options plus optional query keys
 * to invalidate automatically on success.
 * @returns The result of `useMutation` with extended behavior.
 */
export function useAppMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    invalidateKeys?: unknown[];
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    onSuccess: (...args) => {
      options.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key as string[] });
      });
      options.onSuccess?.(...args);
    },
  });
}
