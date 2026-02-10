import { useMatchRoute } from "@tanstack/react-router";

export const useEntity = () => {
  const matchRoute = useMatchRoute();
  const isExpensesRoute = !!matchRoute({ to: "/expenses/$id" });
  const isSplitsRoute = !!matchRoute({ to: "/splits/$id" });

  if (!isExpensesRoute && !isSplitsRoute) {
    throw new Error("UseEntity hook must be used in an expenses or splits route");
  }

  return isExpensesRoute ? "/expenses/$id" : "/splits/$id";
}