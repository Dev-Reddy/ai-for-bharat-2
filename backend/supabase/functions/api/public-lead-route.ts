import { getOptionalAuthContext } from "../_shared/auth.ts";
import { createPublicLead, publicLeadSchema } from "../_shared/lead-system.ts";
import { success } from "../_shared/response.ts";
import { parseJson } from "../_shared/validation.ts";

export async function handlePublicClientLeadCreate(request: Request) {
  const auth = await getOptionalAuthContext(request);
  const payload = await parseJson(request, publicLeadSchema);
  const result = await createPublicLead(auth?.user.id ?? null, payload);
  return success(result, { status: 201 });
}
