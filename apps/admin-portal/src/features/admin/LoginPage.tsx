import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useNavigate, Link } from "../../lib/routerCompat";
import { authApi } from "../../services/authApi";
import { refreshAuthState } from "../../lib/auth";
import { useAuthStore } from "../../store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);
  const isAuthorized = useAuthStore((state) => state.isAuthorized);
  const authError = useAuthStore((state) => state.error);
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginFormValues) => authApi.login(email, password),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError("");
      await mutation.mutateAsync(data);
      await refreshAuthState();
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  if (status === "authenticated" && isAuthorized) {
    return <Navigate to="/admin/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0B0F14] px-4">
      <Card className="w-full max-w-md shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight text-center text-zinc-900 dark:text-zinc-100">
            LeadOS Admin
          </CardTitle>
          <CardDescription className="text-center text-zinc-500 dark:text-zinc-400">
            Enter your credentials to access the portal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900">
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}
            {(mutation.isError || authError) && (
              <Alert variant="destructive" className="py-2 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900">
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {mutation.error instanceof Error ? mutation.error.message : authError}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                {...register("email")}
                className={`bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className={`bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Link to="/admin/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                Forgot password?
              </Link>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white" type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
