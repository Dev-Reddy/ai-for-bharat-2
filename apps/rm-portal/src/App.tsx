import { useEffect, type ReactNode } from "react";
import { RouterProvider, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { rootRoute } from "./routes/__root";
import { rmRoute } from "./routes/rm";
import { dashboardRoute } from "./routes/rm.dashboard";
import { leadsRoute } from "./routes/rm.leads";
import { leadDetailRoute } from "./routes/rm.leads.$leadId";
import { followUpsRoute } from "./routes/rm.follow-ups";
import { feedbackRoute } from "./routes/rm.feedback";
import { notificationsRoute } from "./routes/rm.notifications";
import { rmLoginRoute } from "./routes/rm.login";
import { rmForgotPasswordRoute } from "./routes/rm.forgot-password";
import { rmResetPasswordRoute } from "./routes/rm.reset-password";
import { initializeAuth } from "./lib/auth";
import { authStore, useAuthStore } from "./store/authStore";

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const { status, isAuthorized } = authStore.state;

    throw redirect({
      to: status === "authenticated" && isAuthorized ? "/rm/dashboard" : "/rm/login",
    });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  rmLoginRoute,
  rmForgotPasswordRoute,
  rmResetPasswordRoute,
  rmRoute.addChildren([
    dashboardRoute,
    leadsRoute,
    leadDetailRoute,
    followUpsRoute,
    feedbackRoute,
    notificationsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

function AuthBootstrap({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    void initializeAuth();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-500">
        Restoring your session...
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
    </QueryClientProvider>
  );
}
