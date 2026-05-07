import { getAuthContext } from "../_shared/auth.ts";
import { success } from "../_shared/response.ts";
import { parseJson } from "../_shared/validation.ts";
import {
  activateAnalysisSystemContext,
  analysisSystemContextSchema,
  analysisSystemContextUpdateSchema,
  createAnalysisSystemContext,
  createKnowledgeDocument,
  deleteKnowledgeDocument,
  getAnalyticsClassificationBreakdown,
  getAnalyticsFunnel,
  getAnalyticsLanguageBreakdown,
  getAnalyticsObjectionBreakdown,
  getAnalyticsOverview,
  getAnalyticsRmPerformance,
  getLeadScoreDetail,
  knowledgeDocumentCreateSchema,
  knowledgeDocumentUpdateSchema,
  listAnalysisSystemContexts,
  listFollowUps,
  listKnowledgeDocuments,
  listRmTasks,
  openFollowUpLink,
  runLeadAnalysis,
  updateAnalysisSystemContext,
  updateKnowledgeDocument,
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
  return success(await listFollowUps(auth));
}

export async function handleFollowUpOpenLink(request: Request, followUpId: string) {
  const auth = await getAuthContext(request);
  return success(await openFollowUpLink(auth, followUpId));
}

export async function handleRmTasksList(request: Request) {
  const auth = await getAuthContext(request);
  return success(await listRmTasks(auth));
}

export async function handleKnowledgeDocumentsList(request: Request) {
  const auth = await getAuthContext(request);
  return success(await listKnowledgeDocuments(auth));
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
