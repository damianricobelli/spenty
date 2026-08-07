import { useRouterState } from "@tanstack/react-router";

/**
 * Resolves which entity route the UI is rendering under. Derived from the
 * latest router location (not the committed match) so it stays stable while
 * a client-side transition into these routes is still pending.
 */
export const useEntity = (): "/expenses/$id" | "/splits/$id" => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return pathname.startsWith("/splits") ? "/splits/$id" : "/expenses/$id";
};
