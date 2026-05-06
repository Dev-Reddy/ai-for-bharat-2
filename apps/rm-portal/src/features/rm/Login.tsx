import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as z from "zod";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { authApi } from "../../services/authApi";
import { refreshAuthState } from "../../lib/auth";
import { useAuthStore } from "../../store/authStore";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);
  const isAuthorized = useAuthStore((state) => state.isAuthorized);
  const authError = useAuthStore((state) => state.error);

  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginForm) => authApi.login(email, password),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    await mutation.mutateAsync(data);
    await refreshAuthState();
    navigate({ to: "/rm/dashboard" });
  };

  if (status === "authenticated" && isAuthorized) {
    return <Navigate to="/rm/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-4 text-white text-2xl font-black italic">
            L
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">LeadOS</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Relationship Manager Portal</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  {...register("email")}
                  placeholder="rm@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase tracking-tighter">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase tracking-tighter">{errors.password.message}</p>}
            </div>

            {(mutation.isError || authError) && (
              <p className="text-red-500 text-[10px] font-bold px-1 uppercase tracking-tighter">
                {mutation.error instanceof Error ? mutation.error.message : authError}
              </p>
            )}

            <div className="flex justify-end">
              <Link to="/rm/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 group mt-4"
            >
              {isSubmitting || mutation.isPending ? "Authenticating..." : "Access Portal"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 border-dashed">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Account Access</p>
            <p className="text-xs font-bold text-blue-600">Use your Supabase RM credentials.</p>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-400 text-[10px] font-black uppercase tracking-widest">
          LeadOS Lead Conversion OS v1.0
        </p>
      </div>
    </div>
  );
};
