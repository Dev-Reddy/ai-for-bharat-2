import { ZodError } from "npm:zod@^4.1.12";
import { corsHeaders, withCors } from "../_shared/cors.ts";
import { authErrorResponse } from "../_shared/auth.ts";
import { failure } from "../_shared/response.ts";
import { toValidationDetails } from "../_shared/validation.ts";
import { handleAuthMe } from "./auth-me.ts";
import { handleAdminCreateUser } from "./admin-create-user.ts";
import { handleAdminResendInvite } from "./admin-resend-invite.ts";
import { handleForgotPassword } from "./forgot-password.ts";
import { handleResetPassword } from "./reset-password.ts";
import {
  handleAdminUsersDelete,
  handleAdminUsersList,
  handleAdminUsersUpdate,
} from "./admin-users.ts";

function notFound() {
  return failure("NOT_FOUND", "Route not found.", 404);
}

function methodNotAllowed() {
  return failure("METHOD_NOT_ALLOWED", "Method not allowed.", 405);
}

function cleanPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const apiIndex = segments.lastIndexOf("api");
  return apiIndex >= 0 ? segments.slice(apiIndex + 1) : segments;
}

async function getLeadRoutes() {
  return await import("./lead-routes.ts");
}

async function getAnalysisRoutes() {
  return await import("./analysis-routes.ts");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const path = cleanPath(new URL(request.url).pathname);
    const [resource, id, third, fourth] = path;

    if (request.method === "GET" && resource === "auth-me") {
      return await handleAuthMe(request);
    }

    if (request.method === "POST" && resource === "admin-create-user") {
      return await handleAdminCreateUser(request);
    }

    if (request.method === "POST" && resource === "admin-resend-invite") {
      return await handleAdminResendInvite(request);
    }

    if (request.method === "POST" && resource === "forgot-password") {
      return await handleForgotPassword(request);
    }

    if (request.method === "POST" && resource === "reset-password") {
      return await handleResetPassword(request);
    }

    if (resource === "users" && request.method === "GET" && !id) {
      return await handleAdminUsersList(request);
    }

    if (resource === "users" && request.method === "PATCH" && id) {
      return await handleAdminUsersUpdate(request, id);
    }

    if (resource === "users" && request.method === "DELETE" && id) {
      return await handleAdminUsersDelete(request, id);
    }

    if (resource === "users") {
      return methodNotAllowed();
    }

    if (request.method === "POST" && resource === "public" && id === "leads") {
      const { handlePublicLeadCreate } = await getLeadRoutes();
      return await handlePublicLeadCreate(request);
    }

    if (request.method === "POST" && resource === "public" && id === "client-leads") {
      const { handlePublicClientLeadCreate } = await import("./public-lead-route.ts");
      return await handlePublicClientLeadCreate(request);
    }

    if (
      resource === "public" &&
      id === "leads" &&
      third &&
      fourth === "start-chat"
    ) {
      if (request.method === "POST") {
        const { handlePublicLeadStartChat } = await getLeadRoutes();
        return await handlePublicLeadStartChat(request, third);
      }

      return methodNotAllowed();
    }

    if (
      resource === "public" &&
      id === "chat-threads" &&
      third &&
      fourth === "messages"
    ) {
      if (request.method === "GET") {
        const { handlePublicChatMessagesGet } = await getLeadRoutes();
        return await handlePublicChatMessagesGet(request, third);
      }

      if (request.method === "POST") {
        const { handlePublicChatMessagesPost } = await getLeadRoutes();
        return await handlePublicChatMessagesPost(request, third);
      }

      return methodNotAllowed();
    }

    if (
      resource === "public" &&
      id === "chat-threads" &&
      third &&
      fourth === "end"
    ) {
      if (request.method === "POST") {
        const { handlePublicChatEnd } = await getLeadRoutes();
        return await handlePublicChatEnd(request, third);
      }

      return methodNotAllowed();
    }

    if (resource === "leads" && request.method === "POST" && !id) {
      const { handleLeadCreate } = await getLeadRoutes();
      return await handleLeadCreate(request);
    }

    if (resource === "leads" && request.method === "GET" && !id) {
      const { handleLeadList } = await getLeadRoutes();
      return await handleLeadList(request);
    }

    if (resource === "leads" && request.method === "GET" && id) {
      const { handleLeadDetail } = await getLeadRoutes();
      return await handleLeadDetail(request, id);
    }

    if (resource === "leads" && request.method === "DELETE" && id) {
      const { handleLeadDelete } = await getLeadRoutes();
      return await handleLeadDelete(request, id);
    }

    if (
      resource === "analysis-system-contexts" &&
      request.method === "GET" &&
      !id
    ) {
      const { handleAnalysisSystemContextsList } = await getAnalysisRoutes();
      return await handleAnalysisSystemContextsList(request);
    }

    if (
      resource === "analysis-system-contexts" &&
      request.method === "POST" &&
      !id
    ) {
      const { handleAnalysisSystemContextsCreate } = await getAnalysisRoutes();
      return await handleAnalysisSystemContextsCreate(request);
    }

    if (
      resource === "analysis-system-contexts" &&
      request.method === "PATCH" &&
      id
    ) {
      const { handleAnalysisSystemContextsUpdate } = await getAnalysisRoutes();
      return await handleAnalysisSystemContextsUpdate(request, id);
    }

    if (
      resource === "analysis-system-contexts" &&
      id &&
      third === "activate" &&
      request.method === "POST"
    ) {
      const { handleAnalysisSystemContextsActivate } = await getAnalysisRoutes();
      return await handleAnalysisSystemContextsActivate(request, id);
    }

    if (
      resource === "knowledge-system-contexts" &&
      request.method === "GET" &&
      !id
    ) {
      const { handleKnowledgeSystemContextsList } = await getAnalysisRoutes();
      return await handleKnowledgeSystemContextsList(request);
    }

    if (
      resource === "knowledge-system-contexts" &&
      request.method === "POST" &&
      !id
    ) {
      const { handleKnowledgeSystemContextsCreate } = await getAnalysisRoutes();
      return await handleKnowledgeSystemContextsCreate(request);
    }

    if (
      resource === "knowledge-system-contexts" &&
      request.method === "PATCH" &&
      id
    ) {
      const { handleKnowledgeSystemContextsUpdate } = await getAnalysisRoutes();
      return await handleKnowledgeSystemContextsUpdate(request, id);
    }

    if (
      resource === "knowledge-system-contexts" &&
      id &&
      third === "activate" &&
      request.method === "POST"
    ) {
      const { handleKnowledgeSystemContextsActivate } = await getAnalysisRoutes();
      return await handleKnowledgeSystemContextsActivate(request, id);
    }

    if (
      resource === "analytics" &&
      id === "overview" &&
      request.method === "GET"
    ) {
      const { handleAnalyticsOverview } = await getAnalysisRoutes();
      return await handleAnalyticsOverview(request);
    }

    if (
      resource === "analytics" &&
      id === "funnel" &&
      request.method === "GET"
    ) {
      const { handleAnalyticsFunnel } = await getAnalysisRoutes();
      return await handleAnalyticsFunnel(request);
    }

    if (
      resource === "analytics" &&
      id === "classification-breakdown" &&
      request.method === "GET"
    ) {
      const { handleAnalyticsClassificationBreakdown } = await getAnalysisRoutes();
      return await handleAnalyticsClassificationBreakdown(request);
    }

    if (
      resource === "analytics" &&
      id === "language-breakdown" &&
      request.method === "GET"
    ) {
      const { handleAnalyticsLanguageBreakdown } = await getAnalysisRoutes();
      return await handleAnalyticsLanguageBreakdown(request);
    }

    if (
      resource === "analytics" &&
      id === "objection-breakdown" &&
      request.method === "GET"
    ) {
      const { handleAnalyticsObjectionBreakdown } = await getAnalysisRoutes();
      return await handleAnalyticsObjectionBreakdown(request);
    }

    if (
      resource === "analytics" &&
      id === "rm-performance" &&
      request.method === "GET"
    ) {
      const { handleAnalyticsRmPerformance } = await getAnalysisRoutes();
      return await handleAnalyticsRmPerformance(request);
    }

    if (resource === "follow-ups" && request.method === "GET" && !id) {
      const { handleFollowUpsList } = await getAnalysisRoutes();
      return await handleFollowUpsList(request);
    }

    if (resource === "follow-ups" && request.method === "PATCH" && id) {
      const { handleFollowUpUpdate } = await getAnalysisRoutes();
      return await handleFollowUpUpdate(request, id);
    }

    if (
      resource === "follow-ups" &&
      id &&
      third === "open-link" &&
      request.method === "POST"
    ) {
      const { handleFollowUpOpenLink } = await getAnalysisRoutes();
      return await handleFollowUpOpenLink(request, id);
    }

    if (resource === "rm-tasks" && request.method === "GET" && !id) {
      const { handleRmTasksList } = await getAnalysisRoutes();
      return await handleRmTasksList(request);
    }

    if (resource === "knowledge-documents" && request.method === "GET" && !id) {
      const { handleKnowledgeDocumentsList } = await getAnalysisRoutes();
      return await handleKnowledgeDocumentsList(request);
    }

    if (resource === "knowledge-documents" && request.method === "POST" && !id) {
      const { handleKnowledgeDocumentsCreate } = await getAnalysisRoutes();
      return await handleKnowledgeDocumentsCreate(request);
    }

    if (resource === "knowledge-documents" && request.method === "PATCH" && id) {
      const { handleKnowledgeDocumentsUpdate } = await getAnalysisRoutes();
      return await handleKnowledgeDocumentsUpdate(request, id);
    }

    if (resource === "knowledge-documents" && request.method === "DELETE" && id) {
      const { handleKnowledgeDocumentsDelete } = await getAnalysisRoutes();
      return await handleKnowledgeDocumentsDelete(request, id);
    }

    if (resource === "conversations" && request.method === "GET" && !id) {
      const { handleConversationsList } = await getAnalysisRoutes();
      return await handleConversationsList(request);
    }

    if (resource === "conversations" && request.method === "GET" && id) {
      const { handleConversationDetail } = await getAnalysisRoutes();
      return await handleConversationDetail(request, id);
    }

    if (resource === "portal-settings" && request.method === "GET") {
      const { handlePortalSettingsGet } = await getAnalysisRoutes();
      return await handlePortalSettingsGet(request);
    }

    if (resource === "portal-settings" && request.method === "PATCH") {
      const { handlePortalSettingsUpdate } = await getAnalysisRoutes();
      return await handlePortalSettingsUpdate(request);
    }

    if (
      resource === "leads" &&
      id &&
      third === "assign-rm" &&
      request.method === "POST"
    ) {
      const { handleLeadAssignRm } = await getLeadRoutes();
      return await handleLeadAssignRm(request, id);
    }

    if (
      resource === "leads" &&
      id &&
      third === "schedule-call" &&
      request.method === "POST"
    ) {
      const { handleLeadScheduleCall } = await getLeadRoutes();
      return await handleLeadScheduleCall(request, id);
    }

    if (
      resource === "leads" &&
      id &&
      third === "score" &&
      request.method === "GET"
    ) {
      const { handleLeadScoreDetail } = await getAnalysisRoutes();
      return await handleLeadScoreDetail(request, id);
    }

    if (
      resource === "leads" &&
      id &&
      third === "run-analysis" &&
      request.method === "POST"
    ) {
      const { handleRunLeadAnalysis } = await getAnalysisRoutes();
      return await handleRunLeadAnalysis(request, id);
    }

    if (
      resource === "chat-threads" &&
      id &&
      third === "messages" &&
      request.method === "GET"
    ) {
      const { handleThreadMessages } = await getLeadRoutes();
      return await handleThreadMessages(request, id);
    }

    return notFound();
  } catch (error) {
    if (error instanceof ZodError) {
      return failure(
        "VALIDATION_ERROR",
        "Invalid request payload.",
        422,
        toValidationDetails(error),
      );
    }

    if (error instanceof Error) {
      if (
        error.message === "Missing bearer token" ||
        error.message === "Invalid session" ||
        error.message === "Forbidden"
      ) {
        return authErrorResponse(error);
      }
    }

    console.error(error);
    return withCors(
      Response.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Unexpected server error.",
          },
        },
        { status: 500 },
      ),
    );
  }
});
