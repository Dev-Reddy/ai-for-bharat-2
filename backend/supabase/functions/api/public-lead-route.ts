import { createPublicLead, publicLeadSchema } from "../_shared/lead-system.ts";
import { success } from "../_shared/response.ts";
import { parseJson } from "../_shared/validation.ts";

export async function handlePublicClientLeadCreate(request: Request) {
  const payload = await parseJson(request, publicLeadSchema);
  const result = await createPublicLead(null, payload);
  return success(result, { status: 201 });
}
