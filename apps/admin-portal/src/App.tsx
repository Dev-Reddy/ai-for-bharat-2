import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { RouterProvider, createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "./lib/routerCompat";
import { initializeAuth } from "./lib/auth";
import { useAuthStore } from "./store/authStore";
import RequireAdminAuth from "./features/admin/RequireAdminAuth";
import LoginPage from "./features/admin/LoginPage";
import ForgotPasswordPage from "./features/admin/ForgotPasswordPage";
import ResetPasswordPage from "./features/admin/ResetPasswordPage";
import DashboardPage from "./features/admin/dashboard/DashboardPage";
import LeadsPage from "./features/admin/leads/LeadsPage";
import LeadDetailPage from "./features/admin/leads/LeadDetailPage";
import UsersPage from "./features/admin/users/UsersPage";
import ConversationsPage from "./features/admin/conversations/ConversationsPage";
import AnalyticsPage from "./features/admin/analytics/AnalyticsPage";
import CampaignsPage from "./features/admin/campaigns/CampaignsPage";
import CampaignDetailPage from "./features/admin/campaigns/CampaignDetailPage";
import FollowUpsPage from "./features/admin/followups/FollowUpsPage";
import KnowledgePage from "./features/admin/knowledge/KnowledgePage";
import FeedbackPage from "./features/admin/feedback/FeedbackPage";
import SettingsPage from "./features/admin/settings/SettingsPage";
import ConvertedLeadsPage from "./features/admin/leads/ConvertedLeadsPage";

const rootRoute = createRootRoute({
  component: Outlet,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin/login" });
  },
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: LoginPage,
});

const adminForgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/forgot-password",
  component: ForgotPasswordPage,
});

const adminResetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/reset-password",
  component: ResetPasswordPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: RequireAdminAuth,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "dashboard",
  component: DashboardPage,
});

const adminLeadsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "leads",
  component: LeadsPage,
});

const adminConvertedRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "leads/converted",
  component: ConvertedLeadsPage,
});

const adminLeadDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "leads/$leadId",
  component: LeadDetailPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "users",
  component: UsersPage,
});

const adminConversationsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "conversations",
  component: ConversationsPage,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "analytics",
  component: AnalyticsPage,
});

const adminCampaignsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "campaigns",
  component: CampaignsPage,
});

const adminCampaignDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "campaigns/$campaignId",
  component: CampaignDetailPage,
});

const adminFollowupsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "followups",
  component: FollowUpsPage,
});

const adminKnowledgeRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "knowledge",
  component: KnowledgePage,
});

const adminFeedbackRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "feedback",
  component: FeedbackPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminLoginRoute,
  adminForgotRoute,
  adminResetRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminLeadsRoute,
    adminConvertedRoute,
    adminLeadDetailRoute,
    adminUsersRoute,
    adminConversationsRoute,
    adminAnalyticsRoute,
    adminCampaignsRoute,
    adminCampaignDetailRoute,
    adminFollowupsRoute,
    adminKnowledgeRoute,
    adminFeedbackRoute,
    adminSettingsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function AuthBootstrap({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    void initializeAuth();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0B0F14] text-sm font-medium text-zinc-500">
        Restoring your session...
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <RouterProvider router={router} />
        </AuthBootstrap>
      </QueryClientProvider>
    </>
  );
}
