import { getAuthContext } from "../_shared/auth.ts";
import { failure, success } from "../_shared/response.ts";
import { parseJson } from "../_shared/validation.ts";
import {
  assignLeadToRm,
  assignRmSchema,
  chatMessageSchema,
  createManualLead,
  createPublicLead,
  deleteLead,
  endPublicThreadChat,
  getLeadDetail,
  getPublicThreadMessagesById,
  getThreadMessages,
  listLeads,
  manualLeadSchema,
  publicLeadSchema,
  scheduleCallSchema,
  scheduleLeadCall,
  sendPublicThreadMessage,
  startPublicLeadChatById,
} from "../_shared/lead-system.ts";

function ensureStaff(auth: Awaited<ReturnType<typeof getAuthContext>>) {
  if (auth.userRole !== "admin" && auth.userRole !== "rm") {
    throw new Error("Forbidden");
  }

  return auth;
}

export async function handlePublicLeadCreate(request: Request) {
  const payload = await parseJson(request, publicLeadSchema);
  const result = await createPublicLead(null, payload);
  return success(result, { status: 201 });
}

export async function handlePublicClientLeadCreate(request: Request) {
  const payload = await parseJson(request, publicLeadSchema);
  const result = await createPublicLead(null, payload);
  return success(result, { status: 201 });
}

export async function handlePublicChatMessagesGet(request: Request, threadId: string) {
  const result = await getPublicThreadMessagesById(threadId);
  return success(result);
}

export async function handlePublicChatMessagesPost(request: Request, threadId: string) {
  const payload = await parseJson(request, chatMessageSchema);
  const result = await sendPublicThreadMessage(threadId, payload);
  return success(result);
}

export async function handlePublicChatEnd(request: Request, threadId: string) {
  const result = await endPublicThreadChat(threadId);
  return success(result);
}

export async function handlePublicLeadStartChat(request: Request, leadId: string) {
  const result = await startPublicLeadChatById(leadId);
  return success(result);
}

export async function handleLeadCreate(request: Request) {
  const auth = ensureStaff(await getAuthContext(request));
  const payload = await parseJson(request, manualLeadSchema);
  const result = await createManualLead(auth, payload);
  return success(result, { status: 201 });
}

export async function handleLeadList(request: Request) {
  const auth = await getAuthContext(request);
  const searchParams = new URL(request.url).searchParams;
  const result = await listLeads(auth, {
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "20"),
    sortBy: searchParams.get("sortBy"),
    sortDirection: (searchParams.get("sortDirection") as "asc" | "desc" | null) ?? undefined,
    search: searchParams.get("search"),
    status: searchParams.get("status"),
    classification: searchParams.get("classification"),
  });
  return success(result);
}

export async function handleLeadDetail(request: Request, leadId: string) {
  const auth = await getAuthContext(request);
  const result = await getLeadDetail(auth, leadId);
  return success(result);
}

export async function handleLeadDelete(request: Request, leadId: string) {
  const auth = await getAuthContext(request);
  const result = await deleteLead(auth, leadId);
  return success(result);
}

export async function handleThreadMessages(request: Request, threadId: string) {
  const auth = await getAuthContext(request);
  const result = await getThreadMessages(auth, threadId);
  return success(result);
}

export async function handleLeadScheduleCall(request: Request, leadId: string) {
  const auth = ensureStaff(await getAuthContext(request));
  const payload = await parseJson(request, scheduleCallSchema);
  const result = await scheduleLeadCall(auth, leadId, payload);
  return success(result);
}

export async function handleLeadAssignRm(request: Request, leadId: string) {
  const auth = ensureStaff(await getAuthContext(request));
  const payload = await parseJson(request, assignRmSchema);
  const result = await assignLeadToRm(auth, leadId, payload);
  return success(result);
}

export function notFoundResponse() {
  return failure("NOT_FOUND", "Route not found.", 404);
}
