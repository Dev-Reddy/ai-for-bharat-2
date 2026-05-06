import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { Login } from "../features/rm/Login";

export const rmLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rm/login",
  component: Login,
});
