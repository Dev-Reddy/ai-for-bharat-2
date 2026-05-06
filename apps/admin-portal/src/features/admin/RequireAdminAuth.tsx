import { Navigate } from "../../lib/routerCompat";
import { useAuthStore } from "../../store/authStore";
import AdminLayout from "./AdminLayout";

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0B0F14] text-sm font-medium text-zinc-500">
      Restoring your session...
    </div>
  );
}

function UnauthorizedState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0B0F14] px-4">
      <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:bg-[#111827]">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Access denied</h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      </div>
    </div>
  );
}

export default function RequireAdminAuth() {
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

    return <Navigate to="/admin/login" />;
  }

  if (!isAuthorized) {
    return <UnauthorizedState message={error ?? "You are not authorized for this portal."} />;
  }

  return <AdminLayout />;
}
