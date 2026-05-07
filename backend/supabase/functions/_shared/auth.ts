import type { User } from "jsr:@supabase/supabase-js@2";
import { failure } from "./response.ts";
import { createRequestClient, getServiceClient } from "./supabase.ts";

export type AppRole = "admin" | "rm";

export type AuthContext = {
  accessToken: string;
  user: User;
  claims: Record<string, unknown>;
  userRole: AppRole | null;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return atob(padded);
}

function decodeClaims(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Malformed JWT");
  }

  return JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;
}

export function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length);
}

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    throw new Error("Missing bearer token");
  }

  const requestClient = createRequestClient(accessToken);
  const [{ data, error }, claims] = await Promise.all([
    requestClient.auth.getUser(),
    Promise.resolve(decodeClaims(accessToken)),
  ]);

  if (error || !data.user) {
    throw new Error("Invalid session");
  }

  let userRole: AppRole | null =
    claims.user_role === "admin" || claims.user_role === "rm"
      ? (claims.user_role as AppRole)
      : null;

  if (!userRole) {
    const { data: profile } = await getServiceClient()
      .from("users")
      .select("user_role")
      .eq("id", data.user.id)
      .maybeSingle();

    userRole =
      profile?.user_role === "admin" || profile?.user_role === "rm"
        ? (profile.user_role as AppRole)
        : null;
  }

  return {
    accessToken,
    user: data.user,
    claims,
    userRole,
  };
}

export async function requireRole(request: Request, role: AppRole) {
  const auth = await getAuthContext(request);

  if (auth.userRole !== role) {
    throw new Error("Forbidden");
  }

  return auth;
}

export async function getProfile(userId: string) {
  const { data, error } = await getServiceClient()
    .from("users")
    .select("id, email, name, user_role, is_active, avatar_path")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error("User profile not found");
  }

  return data;
}

export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unauthorized";

  if (message === "Forbidden") {
    return failure("FORBIDDEN", "You are not authorized for this action.", 403);
  }

  return failure("UNAUTHORIZED", "Authentication required.", 401);
}
