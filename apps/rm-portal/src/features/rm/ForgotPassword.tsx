import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { Mail, ArrowLeft } from "lucide-react";
import { authApi } from "../../services/authApi";

const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPassword() {
  const mutation = useMutation({
    mutationFn: ({ email }: ForgotPasswordForm) => authApi.forgotPassword(email),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reset your password</h1>
          <p className="text-sm text-slate-500">
            Enter your RM portal email and we’ll send you a reset link.
          </p>
        </div>

        {mutation.isSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            If the account exists, a password reset email has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  {...register("email")}
                  placeholder="rm@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase tracking-tighter">{errors.email.message}</p>}
              {mutation.isError && (
                <p className="text-red-500 text-[10px] font-bold mt-2 px-1 uppercase tracking-tighter">
                  {mutation.error instanceof Error ? mutation.error.message : "Request failed"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-200"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <Link to="/rm/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    </div>
  );
}
