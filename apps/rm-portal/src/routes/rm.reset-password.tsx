import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { ResetPassword } from "../features/rm/ResetPassword";

export const rmResetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rm/reset-password",
  component: ResetPassword,
});
