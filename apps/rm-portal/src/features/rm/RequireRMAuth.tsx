import { Navigate, Outlet } from "@tanstack/react-router";
import { RMLayout } from "../../components/rm/RMLayout";
import { useAuthStore } from "../../store/authStore";

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-500">
      Restoring your session...
    </div>
  );
}

function UnauthorizedState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Access denied</h1>
        <p className="mt-3 text-sm font-medium text-slate-500">{message}</p>
      </div>
    </div>
  );
}

export function RequireRMAuth() {
  const status = useAuthStore((state) => state.status);
  const isAuthorized = useAuthStore((state) => state.isAuthorized);
  const error = useAuthStore((state) => state.error);

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status !== "authenticated") {
    if (error) {
      return <UnauthorizedState message={error} />;
    }

    return <Navigate to="/rm/login" />;
  }

  if (!isAuthorized) {
    return <UnauthorizedState message={error ?? "You are not authorized for this portal."} />;
  }

  return (
    <RMLayout>
      <Outlet />
    </RMLayout>
  );
}
