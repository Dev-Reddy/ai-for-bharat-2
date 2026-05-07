import { getAuthContext } from "../_shared/auth.ts";
import { success } from "../_shared/response.ts";
import { parseJson } from "../_shared/validation.ts";
import {
  activateAnalysisSystemContext,
  activateKnowledgeSystemContext,
  analysisSystemContextSchema,
  analysisSystemContextUpdateSchema,
  createAnalysisSystemContext,
  createKnowledgeSystemContext,
  createKnowledgeDocument,
  getConversationDetail,
  deleteKnowledgeDocument,
  getAnalyticsClassificationBreakdown,
  getAnalyticsFunnel,
  getAnalyticsLanguageBreakdown,
  getAnalyticsObjectionBreakdown,
  getAnalyticsOverview,
  getAnalyticsRmPerformance,
  getLeadScoreDetail,
  getPortalSettings,
  knowledgeDocumentCreateSchema,
  knowledgeDocumentUpdateSchema,
  knowledgeSystemContextSchema,
  knowledgeSystemContextUpdateSchema,
  listAnalysisSystemContexts,
  listConversations,
  listFollowUps,
  listKnowledgeDocuments,
  listKnowledgeSystemContexts,
  listRmTasks,
  openFollowUpLink,
  runLeadAnalysis,
  updateFollowUp,
  updateAnalysisSystemContext,
  updateKnowledgeSystemContext,
  updateKnowledgeDocument,
  updatePortalSettings,
} from "../_shared/lead-system.ts";

function getPeriod(request: Request) {
  const period = new URL(request.url).searchParams.get("period");
  if (
    period === "daily" ||
    period === "weekly" ||
    period === "monthly" ||
    period === "all_time"
  ) {
    return period;
  }

  return "all_time";
}

export async function handleAnalysisSystemContextsList(request: Request) {
  const auth = await getAuthContext(request);
  return success(await listAnalysisSystemContexts(auth));
}

export async function handleAnalysisSystemContextsCreate(request: Request) {
  const auth = await getAuthContext(request);
  const payload = await parseJson(request, analysisSystemContextSchema);
  return success(await createAnalysisSystemContext(auth, payload), { status: 201 });
}

export async function handleAnalysisSystemContextsUpdate(request: Request, contextId: string) {
  const auth = await getAuthContext(request);
  const payload = await parseJson(request, analysisSystemContextUpdateSchema);
  return success(await updateAnalysisSystemContext(auth, contextId, payload));
}

export async function handleAnalysisSystemContextsActivate(request: Request, contextId: string) {
  const auth = await getAuthContext(request);
  return success(await activateAnalysisSystemContext(auth, contextId));
}

export async function handleKnowledgeSystemContextsList(request: Request) {
  const auth = await getAuthContext(request);
  return success(await listKnowledgeSystemContexts(auth));
}

export async function handleKnowledgeSystemContextsCreate(request: Request) {
  const auth = await getAuthContext(request);
  const payload = await parseJson(request, knowledgeSystemContextSchema);
  return success(await createKnowledgeSystemContext(auth, payload), { status: 201 });
}

export async function handleKnowledgeSystemContextsUpdate(request: Request, contextId: string) {
  const auth = await getAuthContext(request);
  const payload = await parseJson(request, knowledgeSystemContextUpdateSchema);
  return success(await updateKnowledgeSystemContext(auth, contextId, payload));
}

export async function handleKnowledgeSystemContextsActivate(request: Request, contextId: string) {
  const auth = await getAuthContext(request);
  return success(await activateKnowledgeSystemContext(auth, contextId));
}

export async function handleLeadScoreDetail(request: Request, leadId: string) {
  const auth = await getAuthContext(request);
  return success(await getLeadScoreDetail(auth, leadId));
}

export async function handleRunLeadAnalysis(request: Request, leadId: string) {
  const auth = await getAuthContext(request);
  return success(await runLeadAnalysis(auth, leadId));
}

export async function handleAnalyticsOverview(request: Request) {
  const auth = await getAuthContext(request);
  return success(await getAnalyticsOverview(auth, getPeriod(request)));
}

export async function handleAnalyticsFunnel(request: Request) {
  const auth = await getAuthContext(request);
  return success(await getAnalyticsFunnel(auth, getPeriod(request)));
}

export async function handleAnalyticsClassificationBreakdown(request: Request) {
  const auth = await getAuthContext(request);
  return success(await getAnalyticsClassificationBreakdown(auth, getPeriod(request)));
}

export async function handleAnalyticsLanguageBreakdown(request: Request) {
  const auth = await getAuthContext(request);
  return success(await getAnalyticsLanguageBreakdown(auth, getPeriod(request)));
}

export async function handleAnalyticsObjectionBreakdown(request: Request) {
  const auth = await getAuthContext(request);
  return success(await getAnalyticsObjectionBreakdown(auth, getPeriod(request)));
}

export async function handleAnalyticsRmPerformance(request: Request) {
  const auth = await getAuthContext(request);
  return success(await getAnalyticsRmPerformance(auth));
}

export async function handleFollowUpsList(request: Request) {
  const auth = await getAuthContext(request);
  const searchParams = new URL(request.url).searchParams;
  return success(await listFollowUps(auth, {
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "20"),
    sortBy: searchParams.get("sortBy"),
    sortDirection: (searchParams.get("sortDirection") as "asc" | "desc" | null) ?? undefined,
    search: searchParams.get("search"),
    status: searchParams.get("status"),
    classification: searchParams.get("classification"),
  }));
}

export async function handleFollowUpOpenLink(request: Request, followUpId: string) {
  const auth = await getAuthContext(request);
  return success(await openFollowUpLink(auth, followUpId));
}

export async function handleRmTasksList(request: Request) {
  const auth = await getAuthContext(request);
  const searchParams = new URL(request.url).searchParams;
  return success(await listRmTasks(auth, {
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "20"),
    sortBy: searchParams.get("sortBy"),
    sortDirection: (searchParams.get("sortDirection") as "asc" | "desc" | null) ?? undefined,
  }));
}

export async function handleKnowledgeDocumentsList(request: Request) {
  const auth = await getAuthContext(request);
  const searchParams = new URL(request.url).searchParams;
  return success(await listKnowledgeDocuments(auth, {
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "20"),
    sortBy: searchParams.get("sortBy"),
    sortDirection: (searchParams.get("sortDirection") as "asc" | "desc" | null) ?? undefined,
  }));
}

export async function handleKnowledgeDocumentsCreate(request: Request) {
  const auth = await getAuthContext(request);
  const payload = await parseJson(request, knowledgeDocumentCreateSchema);
  return success(await createKnowledgeDocument(auth, payload), { status: 201 });
}

export async function handleKnowledgeDocumentsUpdate(request: Request, documentId: string) {
  const auth = await getAuthContext(request);
  const payload = await parseJson(request, knowledgeDocumentUpdateSchema);
  return success(await updateKnowledgeDocument(auth, documentId, payload));
}

export async function handleKnowledgeDocumentsDelete(request: Request, documentId: string) {
  const auth = await getAuthContext(request);
  return success(await deleteKnowledgeDocument(auth, documentId));
}

export async function handleConversationsList(request: Request) {
  const auth = await getAuthContext(request);
  const searchParams = new URL(request.url).searchParams;
  return success(await listConversations(auth, {
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "20"),
    sortBy: searchParams.get("sortBy"),
    sortDirection: (searchParams.get("sortDirection") as "asc" | "desc" | null) ?? undefined,
    search: searchParams.get("search"),
    classification: searchParams.get("classification"),
    channel: searchParams.get("channel"),
  }));
}

export async function handleConversationDetail(request: Request, conversationId: string) {
  const auth = await getAuthContext(request);
  return success(await getConversationDetail(auth, conversationId));
}

export async function handleFollowUpUpdate(request: Request, followUpId: string) {
  const auth = await getAuthContext(request);
  const payload = await request.json().catch(() => ({}));
  return success(await updateFollowUp(auth, followUpId, payload));
}

export async function handlePortalSettingsGet(request: Request) {
  const auth = await getAuthContext(request);
  return success(await getPortalSettings(auth));
}

export async function handlePortalSettingsUpdate(request: Request) {
  const auth = await getAuthContext(request);
  const payload = await request.json().catch(() => ({}));
  return success(await updatePortalSettings(auth, payload));
}
