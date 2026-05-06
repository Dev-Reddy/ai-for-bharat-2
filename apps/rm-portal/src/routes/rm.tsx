import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { RequireRMAuth } from "../features/rm/RequireRMAuth";

export const rmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rm",
  component: RequireRMAuth,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/rm") {
      throw redirect({ to: "/rm/dashboard" });
    }
  },
});
