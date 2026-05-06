import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "../../lib/routerCompat";
import { z } from "zod";
import { authApi } from "../../services/authApi";
import { refreshAuthState } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function bootstrapRecoverySession() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "recovery" | "invite" | "email",
        });

        if (error) {
          throw error;
        }

        window.history.replaceState({}, document.title, window.location.pathname);
      }

      await refreshAuthState();
    }

    void bootstrapRecoverySession().catch((error) => {
      console.error(error);
    });
  }, []);

  const mutation = useMutation({
    mutationFn: ({ password }: ResetPasswordForm) => authApi.resetPassword(password),
    onSuccess: async () => {
      await refreshAuthState();
      navigate("/admin/dashboard");
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0B0F14] px-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-[#111827] space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Set a new password</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Choose a new password for your admin account.</p>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">New password</label>
            <input
              {...register("password")}
              type="password"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-[#0B0F14] dark:text-zinc-100"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Confirm password</label>
            <input
              {...register("confirmPassword")}
              type="password"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-[#0B0F14] dark:text-zinc-100"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
          {mutation.isError && <p className="text-xs text-red-500">{mutation.error instanceof Error ? mutation.error.message : "Reset failed"}</p>}
          <button className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-900" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
