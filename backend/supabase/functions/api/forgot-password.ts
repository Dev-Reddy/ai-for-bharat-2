import { z } from "npm:zod@^4.1.12";
import { env } from "../_shared/env.ts";
import { success } from "../_shared/response.ts";
import { createPublicClient } from "../_shared/supabase.ts";
import { parseJson } from "../_shared/validation.ts";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  portal: z.enum(["admin", "rm"]),
});

function getPortalResetUrl(portal: "admin" | "rm") {
  const baseUrl = portal === "admin" ? env.adminBaseUrl : env.rmBaseUrl;
  return `${baseUrl}/${portal}/reset-password`;
}

export async function handleForgotPassword(request: Request) {
  const payload = await parseJson(request, forgotPasswordSchema);
  const publicClient = createPublicClient();

  await publicClient.auth.resetPasswordForEmail(payload.email, {
    redirectTo: getPortalResetUrl(payload.portal),
  });

  return success({
    message:
      "If the account exists, a password reset email will be sent shortly.",
  });
}
