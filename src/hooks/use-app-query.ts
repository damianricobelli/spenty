import {
  type QueryKey,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";

/**
 * A wrapper around `useQuery` intended to centralize common query behavior
 * and simplify coordination of internal component or application state.
 *
 * Useful when:
 * - you want a single place to extend `useQuery` behavior
 * - you need to react to successful or failed fetches to update local/UI state
 * - you want consistent handling of side effects via `onSuccess`, `onError`,
 *   or `onSettled` callbacks
 *
 * This hook does NOT replace query fetching logic.
 * It exists to provide a controlled extension point for
 * application-level or component-level side effects.
 *
 * @param options Standard `useQuery` options.
 * @returns The result of `useQuery` with extended behavior.
 */
export function useAppQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  return useQuery(options);
}
