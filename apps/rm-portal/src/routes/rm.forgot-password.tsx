import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { ForgotPassword } from "../features/rm/ForgotPassword";

export const rmForgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rm/forgot-password",
  component: ForgotPassword,
});
