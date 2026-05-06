import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Mail } from "lucide-react";
import { Link } from "../../lib/routerCompat";
import { authApi } from "../../services/authApi";

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const mutation = useMutation({
    mutationFn: ({ email }: ForgotPasswordForm) => authApi.forgotPassword(email),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0B0F14] px-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-[#111827] space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Reset password</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Enter your admin email and we’ll send a reset link.</p>
        </div>

        {mutation.isSuccess ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            If the account exists, a password reset email has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                <input
                  {...register("email")}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-[#0B0F14] dark:text-zinc-100"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              {mutation.isError && <p className="mt-2 text-xs text-red-500">{mutation.error instanceof Error ? mutation.error.message : "Reset request failed"}</p>}
            </div>
            <button className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-900" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <Link to="/admin/login" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          Back to login
        </Link>
      </div>
    </div>
  );
}
