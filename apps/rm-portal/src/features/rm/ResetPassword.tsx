import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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

export function ResetPassword() {
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
      navigate({ to: "/rm/dashboard" });
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set a new password</h1>
          <p className="text-sm text-slate-500">
            Choose a new password for your RM portal account.
          </p>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">
              New Password
            </label>
            <input
              {...register("password")}
              type="password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase tracking-tighter">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">
              Confirm Password
            </label>
            <input
              {...register("confirmPassword")}
              type="password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase tracking-tighter">{errors.confirmPassword.message}</p>}
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-[10px] font-bold px-1 uppercase tracking-tighter">
              {mutation.error instanceof Error ? mutation.error.message : "Password reset failed"}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-200"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
