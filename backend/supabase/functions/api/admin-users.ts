import { z } from "npm:zod@^4.1.12";
import { requireRole } from "../_shared/auth.ts";
import { failure, success } from "../_shared/response.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { parseJson } from "../_shared/validation.ts";

const updateAdminUserSchema = z.object({
  name: z.string().min(1).optional(),
  userRole: z.enum(["admin", "rm"]).optional(),
  isActive: z.boolean().optional(),
});

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

export async function handleAdminUsersList(request: Request) {
  await requireRole(request, "admin");
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from("users")
    .select("id, email, name, user_role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return failure("LIST_USERS_FAILED", error.message, 500);
  }

  const usersWithInviteState = await Promise.all(
    data.map(async (user) => {
      const authUserResult = await serviceClient.auth.admin.getUserById(user.id);
      const authUser = authUserResult.data.user;
      const invitePending = Boolean(authUser) && !authUser.last_sign_in_at;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.user_role,
        isActive: user.is_active,
        createdAt: user.created_at,
        invitePending,
      };
    }),
  );

  return success(
    usersWithInviteState,
  );
}

export async function handleAdminUsersDelete(
  request: Request,
  userId: string,
) {
  const auth = await requireRole(request, "admin");
  const serviceClient = getServiceClient();

  if (auth.user.id === userId) {
    return failure("DELETE_NOT_ALLOWED", "You cannot delete your own account.", 400);
  }

  const { data: targetUser, error: targetUserError } = await serviceClient
    .from("users")
    .select("id, user_role")
    .eq("id", userId)
    .single();

  if (targetUserError || !targetUser) {
    return failure("USER_NOT_FOUND", "User not found.", 404);
  }

  if (targetUser.user_role === "admin") {
    return failure("DELETE_NOT_ALLOWED", "Admin accounts cannot be deleted here.", 400);
  }

  const deleteResult = await serviceClient.auth.admin.deleteUser(userId);

  if (deleteResult.error) {
    if (deleteResult.error.message === "User not found") {
      const cleanupResult = await serviceClient
        .from("users")
        .delete()
        .eq("id", userId);

      if (cleanupResult.error) {
        return failure("DELETE_USER_FAILED", cleanupResult.error.message, 500);
      }

      return success({ userId, orphanProfileDeleted: true });
    }

    return failure("DELETE_USER_FAILED", deleteResult.error.message, 500);
  }

  return success({ userId });
}

export async function handleAdminUsersUpdate(
  request: Request,
  userId: string,
) {
  await requireRole(request, "admin");
  const payload = await parseJson(request, updateAdminUserSchema);
  const serviceClient = getServiceClient();

  const updatePayload: Record<string, unknown> = {};
  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.isActive !== undefined) updatePayload.is_active = payload.isActive;
  if (payload.userRole !== undefined) updatePayload.user_role = payload.userRole;

  const { data, error } = await serviceClient
    .from("users")
    .update(updatePayload)
    .eq("id", userId)
    .select("id, email, name, user_role, is_active, created_at")
    .single();

  if (error || !data) {
    return failure("UPDATE_USER_FAILED", error?.message ?? "User not found.", 400);
  }

  if (payload.userRole) {
    await ensureRoleRows(userId, payload.userRole);
  }

  return success({
    user: {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.user_role,
      isActive: data.is_active,
      createdAt: data.created_at,
    },
  });
}
