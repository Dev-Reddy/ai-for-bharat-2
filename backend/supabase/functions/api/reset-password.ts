import { z } from "npm:zod@^4.1.12";
import { getAuthContext } from "../_shared/auth.ts";
import { failure, success } from "../_shared/response.ts";
import { createRequestClient } from "../_shared/supabase.ts";
import { parseJson } from "../_shared/validation.ts";

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

export async function handleResetPassword(request: Request) {
  const auth = await getAuthContext(request);
  const payload = await parseJson(request, resetPasswordSchema);
  const requestClient = createRequestClient(auth.accessToken);
  const { error } = await requestClient.auth.updateUser({
    password: payload.password,
  });

  if (error) {
    return failure("RESET_PASSWORD_FAILED", error.message, 400);
  }

  return success({ updated: true });
}
