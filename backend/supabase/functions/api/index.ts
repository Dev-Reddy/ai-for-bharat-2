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
import {
  handleLeadAssignRm,
  handleLeadCreate,
  handleLeadDetail,
  handleLeadList,
  handleLeadScheduleCall,
  handlePublicChatEnd,
  handlePublicLeadStartChat,
  handlePublicChatMessagesGet,
  handlePublicChatMessagesPost,
  handlePublicLeadCreate,
  handleThreadMessages,
} from "./lead-routes.ts";
import {
  handleAnalysisSystemContextsActivate,
  handleAnalysisSystemContextsCreate,
  handleAnalysisSystemContextsList,
  handleAnalysisSystemContextsUpdate,
  handleAnalyticsClassificationBreakdown,
  handleAnalyticsFunnel,
  handleAnalyticsLanguageBreakdown,
  handleAnalyticsObjectionBreakdown,
  handleAnalyticsOverview,
  handleAnalyticsRmPerformance,
  handleFollowUpOpenLink,
  handleFollowUpsList,
  handleKnowledgeDocumentsCreate,
  handleKnowledgeDocumentsDelete,
  handleKnowledgeDocumentsList,
  handleKnowledgeDocumentsUpdate,
  handleLeadScoreDetail,
  handleRmTasksList,
  handleRunLeadAnalysis,
} from "./theme7-routes.ts";

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
      return await handlePublicLeadCreate(request);
    }

    if (
      resource === "public" &&
      id === "leads" &&
      third &&
      fourth === "start-chat"
    ) {
      if (request.method === "POST") {
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
        return await handlePublicChatMessagesGet(request, third);
      }

      if (request.method === "POST") {
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
        return await handlePublicChatEnd(request, third);
      }

      return methodNotAllowed();
    }

    if (resource === "leads" && request.method === "POST" && !id) {
      return await handleLeadCreate(request);
    }

    if (resource === "leads" && request.method === "GET" && !id) {
      return await handleLeadList(request);
    }

    if (resource === "leads" && request.method === "GET" && id) {
      return await handleLeadDetail(request, id);
    }

    if (
      resource === "analysis-system-contexts" &&
      request.method === "GET" &&
      !id
    ) {
      return await handleAnalysisSystemContextsList(request);
    }

    if (
      resource === "analysis-system-contexts" &&
      request.method === "POST" &&
      !id
    ) {
      return await handleAnalysisSystemContextsCreate(request);
    }

    if (
      resource === "analysis-system-contexts" &&
      request.method === "PATCH" &&
      id
    ) {
      return await handleAnalysisSystemContextsUpdate(request, id);
    }

    if (
      resource === "analysis-system-contexts" &&
      id &&
      third === "activate" &&
      request.method === "POST"
    ) {
      return await handleAnalysisSystemContextsActivate(request, id);
    }

    if (
      resource === "analytics" &&
      id === "overview" &&
      request.method === "GET"
    ) {
      return await handleAnalyticsOverview(request);
    }

    if (
      resource === "analytics" &&
      id === "funnel" &&
      request.method === "GET"
    ) {
      return await handleAnalyticsFunnel(request);
    }

    if (
      resource === "analytics" &&
      id === "classification-breakdown" &&
      request.method === "GET"
    ) {
      return await handleAnalyticsClassificationBreakdown(request);
    }

    if (
      resource === "analytics" &&
      id === "language-breakdown" &&
      request.method === "GET"
    ) {
      return await handleAnalyticsLanguageBreakdown(request);
    }

    if (
      resource === "analytics" &&
      id === "objection-breakdown" &&
      request.method === "GET"
    ) {
      return await handleAnalyticsObjectionBreakdown(request);
    }

    if (
      resource === "analytics" &&
      id === "rm-performance" &&
      request.method === "GET"
    ) {
      return await handleAnalyticsRmPerformance(request);
    }

    if (resource === "follow-ups" && request.method === "GET" && !id) {
      return await handleFollowUpsList(request);
    }

    if (
      resource === "follow-ups" &&
      id &&
      third === "open-link" &&
      request.method === "POST"
    ) {
      return await handleFollowUpOpenLink(request, id);
    }

    if (resource === "rm-tasks" && request.method === "GET" && !id) {
      return await handleRmTasksList(request);
    }

    if (resource === "knowledge-documents" && request.method === "GET" && !id) {
      return await handleKnowledgeDocumentsList(request);
    }

    if (resource === "knowledge-documents" && request.method === "POST" && !id) {
      return await handleKnowledgeDocumentsCreate(request);
    }

    if (resource === "knowledge-documents" && request.method === "PATCH" && id) {
      return await handleKnowledgeDocumentsUpdate(request, id);
    }

    if (resource === "knowledge-documents" && request.method === "DELETE" && id) {
      return await handleKnowledgeDocumentsDelete(request, id);
    }

    if (
      resource === "leads" &&
      id &&
      third === "assign-rm" &&
      request.method === "POST"
    ) {
      return await handleLeadAssignRm(request, id);
    }

    if (
      resource === "leads" &&
      id &&
      third === "schedule-call" &&
      request.method === "POST"
    ) {
      return await handleLeadScheduleCall(request, id);
    }

    if (
      resource === "leads" &&
      id &&
      third === "score" &&
      request.method === "GET"
    ) {
      return await handleLeadScoreDetail(request, id);
    }

    if (
      resource === "leads" &&
      id &&
      third === "run-analysis" &&
      request.method === "POST"
    ) {
      return await handleRunLeadAnalysis(request, id);
    }

    if (
      resource === "chat-threads" &&
      id &&
      third === "messages" &&
      request.method === "GET"
    ) {
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
