import { z } from "npm:zod@^4.1.12";
import { env } from "../_shared/env.ts";
import { requireRole } from "../_shared/auth.ts";
import { failure, success } from "../_shared/response.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { parseJson } from "../_shared/validation.ts";

const resendInviteSchema = z.object({
  userId: z.string().uuid(),
});

function getPortalResetUrl(role: "admin" | "rm") {
  const baseUrl = role === "admin" ? env.adminBaseUrl : env.rmBaseUrl;
  return `${baseUrl}/${role}/reset-password`;
}

export async function handleAdminResendInvite(request: Request) {
  await requireRole(request, "admin");
  const payload = await parseJson(request, resendInviteSchema);
  const serviceClient = getServiceClient();

  const { data: user, error } = await serviceClient
    .from("users")
    .select("id, email, user_role")
    .eq("id", payload.userId)
    .single();

  if (error || !user) {
    return failure("USER_NOT_FOUND", "User not found.", 404);
  }

  const authUserResult = await serviceClient.auth.admin.getUserById(user.id);

  if (authUserResult.error || !authUserResult.data.user) {
    return failure(
      "AUTH_USER_NOT_FOUND",
      authUserResult.error?.message ?? "Auth user not found.",
      404,
    );
  }

  if (authUserResult.data.user.last_sign_in_at) {
    return failure(
      "INVITE_NOT_ALLOWED",
      "This user has already activated their account. They should use forgot password themselves.",
      409,
    );
  }

  const inviteResult = await serviceClient.auth.admin.inviteUserByEmail(
    user.email,
    {
      redirectTo: getPortalResetUrl(user.user_role),
      data: {
        name: user.name,
        user_role: user.user_role,
      },
    },
  );

  if (inviteResult.error) {
    return failure(
      "INVITE_EMAIL_FAILED",
      inviteResult.error.message,
      500,
    );
  }

  return success({ userId: user.id });
}
