import { z } from "npm:zod@^4.1.12";
import { env } from "../_shared/env.ts";
import { requireRole } from "../_shared/auth.ts";
import { failure, success } from "../_shared/response.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { parseJson } from "../_shared/validation.ts";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  userRole: z.enum(["admin", "rm"]),
});

function getPortalResetUrl(role: "admin" | "rm") {
  const baseUrl = role === "admin" ? env.adminBaseUrl : env.rmBaseUrl;
  return `${baseUrl}/${role}/reset-password`;
}

async function ensureRoleRows(userId: string, userRole: "admin" | "rm") {
  const serviceClient = getServiceClient();

  if (userRole === "admin") {
    await serviceClient.from("admin_users").upsert({ user_id: userId });
    await serviceClient.from("rm_users").delete().eq("user_id", userId);
    return;
  }

  await serviceClient.from("rm_users").upsert({ user_id: userId });
  await serviceClient.from("admin_users").delete().eq("user_id", userId);
}

export async function handleAdminCreateUser(request: Request) {
  await requireRole(request, "admin");
  const payload = await parseJson(request, createUserSchema);
  const serviceClient = getServiceClient();

  const { data: existing } = await serviceClient
    .from("users")
    .select("id")
    .eq("email", payload.email)
    .maybeSingle();

  if (existing) {
    return failure("USER_EXISTS", "A user with this email already exists.", 409);
  }

  const createResult = await serviceClient.auth.admin.inviteUserByEmail(
    payload.email,
    {
      redirectTo: getPortalResetUrl(payload.userRole),
      data: {
        name: payload.name,
        user_role: payload.userRole,
      },
    },
  );

  if (createResult.error || !createResult.data.user) {
    return failure(
      "CREATE_USER_FAILED",
      createResult.error?.message ?? "Unable to create user.",
      400,
    );
  }

  const userId = createResult.data.user.id;

  const upsertProfile = await serviceClient.from("users").upsert({
    id: userId,
    email: payload.email,
    name: payload.name,
    user_role: payload.userRole,
    is_active: true,
  });

  if (upsertProfile.error) {
    return failure(
      "PROFILE_UPSERT_FAILED",
      upsertProfile.error.message,
      500,
    );
  }

  await ensureRoleRows(userId, payload.userRole);

  return success(
    {
      user: {
        id: userId,
        email: payload.email,
        name: payload.name,
        userRole: payload.userRole,
        isActive: true,
      },
    },
    { status: 201 },
  );
}
