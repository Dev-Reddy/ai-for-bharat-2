import {
  MOCK_LEADS,
  MOCK_RMS,
  MOCK_CONVERSATIONS,
  MOCK_CAMPAIGNS,
  MOCK_FOLLOWUPS,
  MOCK_KNOWLEDGE_DOCS,
  MOCK_FEEDBACK,
} from "../mocks/admin.mock";
import { AnalysisSystemContext, KnowledgeSystemContext, Lead, User } from "../types/admin.types";
import { API_BASE, supabase } from "../lib/supabase";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error("You must be logged in to perform this action.");
  }

  return accessToken;
}

async function apiRequest(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? "Request failed.");
  }

  return payload.data;
}

function buildQueryString(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") {
      continue;
    }
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function mapLeadFromBackend(raw: any): Lead {
  const scoreBreakdown = raw.latestScoreBreakdown ?? {};
  const score =
    typeof scoreBreakdown.totalScore === "number"
      ? Math.round(scoreBreakdown.totalScore)
      : typeof raw.latestScore === "number"
        ? raw.latestScore
        : 0;

  const progressStatus = raw.progressStatus ?? "";
  const contactStatus = raw.contactStatus ?? "";
  const status =
    progressStatus === "assigned"
      ? "assigned_to_rm"
      : progressStatus === "converted"
        ? "converted"
        : contactStatus === "pending"
          ? "pending_contact"
      : raw.preferredContactMethod === "call_under_5_min" || raw.hasAnyCall
            ? "follow_up_scheduled"
            : "conversation_completed";

  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    phoneE164: raw.phoneE164 ?? raw.phone,
    countryIso: raw.countryIso ?? undefined,
    countryCode: raw.countryCode ?? undefined,
    mobileNumberRaw: raw.mobileNumberRaw ?? undefined,
    email: raw.email ?? undefined,
    city: raw.address ?? undefined,
    source: raw.source ?? undefined,
    sourceLabel: raw.sourceLabel ?? raw.source ?? undefined,
    createdByUserId: raw.createdByUserId ?? null,
    createdByUser: raw.createdByUser
      ? {
          id: raw.createdByUser.id,
          name: raw.createdByUser.name,
          email: raw.createdByUser.email,
        }
      : null,
    preferredLanguage: raw.preferredLanguage ?? undefined,
    preferredChannel:
      raw.preferredContactMethod === "call_under_5_min" ? "voice" : "chat",
    status,
    classification: raw.finalInterestScore ?? scoreBreakdown.classification ?? "cold",
    latestScore: score,
    latestSummary: raw.overallSummary ?? undefined,
    latestNextAction: raw.recommendedNextAction ?? undefined,
    assignedRm: raw.assignedRm
      ? {
          id: raw.assignedRm.id,
          name: raw.assignedRm.name,
          email: raw.assignedRm.email,
        }
      : undefined,
    hasAnyCall: Boolean(raw.hasAnyCall),
    canStartCall: Boolean(raw.canStartCall ?? !raw.hasAnyCall),
    leadWaMeLink: raw.leadWaMeLink ?? null,
    latestTranscriptSource: raw.latestTranscriptSource ?? null,
    latestTranscript: raw.latestTranscript ?? null,
    latestScoreBreakdown: scoreBreakdown,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// In-memory state for true dynamicity
let memoryLeads = [...MOCK_LEADS];
let memoryRMs = [...MOCK_RMS];
let memoryConversations = [...MOCK_CONVERSATIONS];
let memoryCampaigns = [...MOCK_CAMPAIGNS];
let memoryFollowUps = [...MOCK_FOLLOWUPS];
let memoryKnowledgeDocs = [...MOCK_KNOWLEDGE_DOCS];
let memoryFeedback = [...MOCK_FEEDBACK];
type PortalSettings = {
  websiteChatGreetingTemplate?: string;
  websiteChatGreetingTemplateHi?: string;
  whatsappFollowUpTemplate?: string;
};

export const adminApi = {
  getSettings: async () => {
    const data = await apiRequest("/portal-settings", { method: "GET" });
    return { data };
  },
  updateSettings: async (newSettings: PortalSettings) => {
    const data = await apiRequest("/portal-settings", {
      method: "PATCH",
      body: JSON.stringify(newSettings),
    });
    return { data, message: "Settings updated successfully" };
  },
  async loginAdmin() {
    throw new Error("Use authApi.login instead.");
  },

  async getAdminDashboardOverview(period: "daily" | "weekly" | "monthly" | "all_time" = "all_time") {
    const [overview, funnel, classificationBreakdown, languageBreakdown, objectionBreakdown] = await Promise.all([
      apiRequest(`/analytics/overview?period=${period}`, { method: "GET" }),
      apiRequest(`/analytics/funnel?period=${period}`, { method: "GET" }),
      apiRequest(`/analytics/classification-breakdown?period=${period}`, { method: "GET" }),
      apiRequest(`/analytics/language-breakdown?period=${period}`, { method: "GET" }),
      apiRequest(`/analytics/objection-breakdown?period=${period}`, { method: "GET" }),
    ]);

    const breakdownMap = Object.fromEntries(
      (classificationBreakdown as Array<any>).map((item) => [item.key, item.value]),
    );

    return {
      success: true,
      data: {
        overview: {
          ...overview.overview,
          hot: breakdownMap.hot ?? 0,
          warm: breakdownMap.warm ?? 0,
          cold: breakdownMap.cold ?? 0,
        },
        funnel,
        classificationBreakdown,
        languageStats: languageBreakdown,
        objectionStats: objectionBreakdown,
        scoreBreakdown: overview.scoreBreakdown ?? [],
        scoreDimensionAverages: overview.scoreDimensionAverages ?? {},
        leadScoreRows: overview.leadScoreRows ?? [],
        rmLoad: overview.rmLoad ?? [],
      },
    };
  },

  async getLeads(params: any) {
    const response = await apiRequest(`/leads${buildQueryString(params)}`, { method: "GET" });
    const leads = (Array.isArray(response.data) ? response.data : []).map(mapLeadFromBackend);
    return {
      success: true,
      data: leads,
      pagination: response.pagination,
    };
  },

  async getLeadDetail(leadId: string) {
    const data = await apiRequest(`/leads/${leadId}`, { method: "GET" });
    const lead = mapLeadFromBackend(data.lead);
    const messages = data.latestTranscriptSource === "call_thread"
      ? String(data.latestTranscript ?? "")
        .split("\n")
        .filter(Boolean)
        .map((line: string, index: number) => {
          const [speaker, ...rest] = line.split(":");
          const content = rest.join(":").trim();
          return {
            id: `${leadId}-call-${index}`,
            role: speaker.toLowerCase().includes("ai") ? "assistant" : "user",
            content,
            sequenceNo: index + 1,
            timestamp: data.latestCallThread?.startedAt ?? data.latestCallThread?.requestedAt ?? lead.createdAt,
          };
        })
      : (data.messages ?? []).map((message: any, index: number) => ({
          id: message.id,
          role: message.senderType === "ai" ? "assistant" : "user",
          content: message.messageText,
          sequenceNo: index + 1,
          timestamp: message.sentAt,
        }));
    return {
      success: true,
      data: {
        lead,
        campaign: { id: "campaign_1", name: "Rupeezy AP Campaign" },
        assignedRm: lead.assignedRm || null,
        latestConversation: data.latestTranscriptSource !== "call_thread" && data.latestChatThread
          ? {
              id: data.latestChatThread.id,
              channel: "chat",
              status: data.latestChatThread.status,
              language: lead.preferredLanguage || "english",
              durationSeconds: 0,
              summary: lead.latestSummary || "Conversation stored in thread history.",
            }
          : data.latestCallThread
            ? {
                id: data.latestCallThread.id,
                channel: "voice",
                status: data.latestCallThread.status,
                language: lead.preferredLanguage || "english",
                durationSeconds: data.latestCallThread.durationSeconds ?? 0,
                summary: data.latestCallThread.transcript || "Call transcript stored.",
              }
            : null,
        messages,
        score: data.latestScore
          ? {
              id: data.latestScore.id,
              classification: data.latestScore.classification,
              totalScore: Math.round(data.latestScore.totalScore),
              readinessToSignupScore: Math.round(data.latestScore.readinessToSignupScore),
              interestLevelScore: Math.round(data.latestScore.interestLevelScore),
              networkSizeScore: Math.round(data.latestScore.networkSizeScore),
              reason: data.latestScore.reason,
              detectedLanguage: data.latestScore.detectedLanguage,
              recommendedNextAction:
                data.latestScore.recommendedNextAction ?? "Review the lead and decide the next step.",
              positiveSignals: data.latestScore.topicsCovered ?? [],
              negativeSignals: [],
              objections: data.latestScore.objections ?? [],
              suggestedOpeningLine: data.latestScore.suggestedOpeningLine ?? "",
              handoffSummary: data.latestScore.handoffSummary ?? "",
            }
          : lead.latestScoreBreakdown ?? null,
        rmTask: data.latestRmTask ?? null,
        followUp: data.latestFollowUp ?? null,
        latestTranscriptSource: data.latestTranscriptSource,
        latestTranscript: data.latestTranscript,
      },
    };
  },

  async addLead(payload: any) {
    const data = await apiRequest("/leads", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        countryIso: payload.countryIso,
        countryCode: payload.countryCode,
        mobileNumber: payload.mobileNumber,
        email: payload.email || "",
        address: payload.address || payload.city || "",
        preferredLanguage: payload.preferredLanguage || "english",
        preferredContactMethod: payload.preferredContactMethod || "chat_now",
        assignedRmId: payload.assignedRmId || undefined,
      }),
    });

    return {
      success: true,
      data: {
        lead: mapLeadFromBackend(data.lead),
      },
    };
  },

  async deleteLead(leadId: string) {
    await apiRequest(`/leads/${leadId}`, {
      method: "DELETE",
    });
    return { success: true };
  },

  async assignRm(leadId: string, rmId: string) {
    await apiRequest(`/leads/${leadId}/assign-rm`, {
      method: "POST",
      body: JSON.stringify({ assignedRmId: rmId }),
    });
    return { success: true };
  },

  async scheduleLeadCall(leadId: string) {
    const data = await apiRequest(`/leads/${leadId}/schedule-call`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return { success: true, data };
  },

  async getUsers(params: any = {}) {
    const data = await apiRequest("/users", { method: "GET" });
    return {
      success: true,
      data: data as User[],
      pagination: {
        page: 1,
        limit: 20,
        total: Array.isArray(data) ? data.length : 0,
        totalPages: 1,
      },
    };
  },

  async createRM(payload: any) {
    const data = await apiRequest("/admin-create-user", {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        name: payload.name,
        userRole: payload.role ?? "rm",
      }),
    });

    return {
      success: true,
      data: {
        rm: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.userRole,
          isActive: data.user.isActive,
          createdAt: new Date().toISOString(),
        },
      },
    };
  },

  async deactivateUser(userId: string) {
    await apiRequest(`/users/${userId}`, {
      method: "DELETE",
    });
    return { success: true };
  },

  async getConversations(params: any = {}) {
    const response = await apiRequest(`/conversations${buildQueryString(params)}`, { method: "GET" });
    return {
      success: true,
      data: response.data ?? [],
      pagination: response.pagination,
    };
  },

  async getConversationDetail(conversationId: string) {
    const data = await apiRequest(`/conversations/${conversationId}`, { method: "GET" });
    return {
      success: true,
      data: {
        ...data,
        sentiment: data.classification === "hot" ? "positive" : data.classification === "warm" ? "neutral" : "hesitant",
      },
    };
  },

  async getCampaigns(params: any = {}) {
    await delay(400);
    return { success: true, data: memoryCampaigns, pagination: { page: 1, limit: 20, total: memoryCampaigns.length, totalPages: 1 } };
  },

  async updateCampaignStatus(campaignId: string, isActive: boolean) {
    await delay(300);
    memoryCampaigns = memoryCampaigns.map(c => c.id === campaignId ? { ...c, isActive } : c);
    return { success: true };
  },

  async getFollowUps(params: any = {}) {
    const response = await apiRequest(`/follow-ups${buildQueryString(params)}`, { method: "GET" });
    return {
      success: true,
      data: (Array.isArray(response.data) ? response.data : []).map((item: any) => {
        const lead = item.lead ?? null;
        return {
          ...item,
          lead: lead
            ? {
                id: lead.id,
                name: lead.name,
                phone: lead.phone,
                classification: lead.classification,
              }
            : {
                id: item.leadId,
                name: "Unknown Lead",
                phone: "",
                classification: "warm",
              },
        };
      }),
      pagination: response.pagination,
    };
  },

  async syncFollowUps() {
    await delay(200);
    return { success: true };
  },

  async updateFollowUpStatus(followUpId: string, status: string) {
    const data = await apiRequest(`/follow-ups/${followUpId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return { success: true, data };
  },

  async updateFollowUpMessage(followUpId: string, message: string) {
    const data = await apiRequest(`/follow-ups/${followUpId}`, {
      method: "PATCH",
      body: JSON.stringify({ message }),
    });
    return { success: true, data };
  },

  async getKnowledgeDocuments(params: any = {}) {
    const response = await apiRequest(`/knowledge-documents${buildQueryString(params)}`, { method: "GET" });
    return {
      success: true,
      data: response.data as any[],
      pagination: response.pagination,
    };
  },
  
  async addKnowledgeDocument(payload: any) {
    const data = await apiRequest("/knowledge-documents", {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        type: payload.type,
        content: payload.content,
        sourceFileName: payload.sourceFileName,
        isActive: true,
      }),
    });
    return { success: true, data };
  },

  async updateKnowledgeDocument(id: string, payload: any) {
    const data = await apiRequest(`/knowledge-documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: payload.title,
        type: payload.type,
        content: payload.content,
        sourceFileName: payload.sourceFileName,
      }),
    });
    return { success: true, data };
  },

  async deleteKnowledgeDocument(id: string) {
    await apiRequest(`/knowledge-documents/${id}`, {
      method: "DELETE",
    });
    return { success: true };
  },

  async getFeedback(params: any = {}) {
    await delay(400);
    return { success: true, data: memoryFeedback, pagination: { page: 1, limit: 20, total: memoryFeedback.length, totalPages: 1 } };
  },
  
  async addFeedback(payload: any) {
    await delay(400);
    const lead = memoryLeads.find(l => l.id === payload.leadId) || { name: 'Unknown Lead' };
    const rm = memoryRMs.find(r => r.id === payload.rmId) || { name: 'Unknown RM' };
    const newFeedback = {
      id: "feedback_" + Date.now(),
      leadId: payload.leadId,
      leadName: lead.name,
      rmId: payload.rmId,
      rmName: rm.name,
      originalClassification: payload.originalClassification,
      correctedClassification: payload.correctedClassification,
      originalScore: payload.originalScore,
      correctedScore: payload.correctedScore,
      feedbackType: payload.feedbackType || "other",
      comment: payload.comment,
      createdAt: new Date().toISOString()
    };
    memoryFeedback = [newFeedback, ...memoryFeedback];
    return { success: true, data: newFeedback };
  },

  async updateUser(id: string, payload: any) {
    await apiRequest(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: payload.name,
        userRole: payload.role,
        isActive: payload.isActive,
      }),
    });
    return { success: true };
  },

  async resendInvite(userId: string) {
    await apiRequest("/admin-resend-invite", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    return { success: true };
  },

  async addCampaign(payload: any) {
    await delay(400);
    const newCamp = {
      id: "camp_" + Date.now(),
      name: payload.name,
      source: payload.source,
      isActive: true,
      leadCount: 0,
      hotCount: 0,
      warmCount: 0,
      coldCount: 0,
      convertedCount: 0,
    };
    memoryCampaigns = [newCamp, ...memoryCampaigns];
    return { success: true, data: newCamp };
  },

  async getRmPerformance() {
    const data = await apiRequest("/analytics/rm-performance", { method: "GET" });
    return { success: true, data: data as User[] };
  },

  async getAnalysisSystemContexts() {
    const data = await apiRequest("/analysis-system-contexts", { method: "GET" });
    return { success: true, data: data as AnalysisSystemContext[] };
  },

  async createAnalysisSystemContext(payload: {
    name: string;
    description?: string;
    promptTemplate: string;
  }) {
    const data = await apiRequest("/analysis-system-contexts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { success: true, data: data as AnalysisSystemContext };
  },

  async updateAnalysisSystemContext(id: string, payload: Partial<{
    name: string;
    description: string;
    promptTemplate: string;
  }>) {
    const data = await apiRequest(`/analysis-system-contexts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return { success: true, data: data as AnalysisSystemContext };
  },

  async activateAnalysisSystemContext(id: string) {
    const data = await apiRequest(`/analysis-system-contexts/${id}/activate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return { success: true, data: data as AnalysisSystemContext };
  },

  async getKnowledgeSystemContexts() {
    const data = await apiRequest("/knowledge-system-contexts", { method: "GET" });
    return { success: true, data: data as KnowledgeSystemContext[] };
  },

  async createKnowledgeSystemContext(payload: {
    name: string;
    description?: string;
    promptTemplate: string;
  }) {
    const data = await apiRequest("/knowledge-system-contexts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { success: true, data: data as KnowledgeSystemContext };
  },

  async updateKnowledgeSystemContext(id: string, payload: Partial<{
    name: string;
    description: string;
    promptTemplate: string;
  }>) {
    const data = await apiRequest(`/knowledge-system-contexts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return { success: true, data: data as KnowledgeSystemContext };
  },

  async activateKnowledgeSystemContext(id: string) {
    const data = await apiRequest(`/knowledge-system-contexts/${id}/activate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return { success: true, data: data as KnowledgeSystemContext };
  },

  async runLeadAnalysis(leadId: string) {
    const data = await apiRequest(`/leads/${leadId}/run-analysis`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return { success: true, data };
  }
};
