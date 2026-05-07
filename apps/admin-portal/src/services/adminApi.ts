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
import { supabase } from "../lib/supabase";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

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

function mapLeadFromBackend(raw: any): Lead {
  const score =
    typeof raw.interestLevelScore === "number" &&
    typeof raw.readinessToSignupScore === "number" &&
    typeof raw.networkSizeScore === "number"
      ? Math.round(raw.interestLevelScore + raw.readinessToSignupScore + raw.networkSizeScore)
      : 0;

  const status =
    raw.progressStatus === "assigned"
      ? "assigned_to_rm"
      : raw.progressStatus === "converted"
        ? "converted"
        : raw.contactStatus === "pending"
          ? "pending_contact"
      : raw.preferredContactMethod === "call_under_5_min"
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
    classification: raw.finalInterestScore ?? "cold",
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
let memorySettings = {
  clientName: "FinPartner Pro",
  workspaceId: "client_1",
  supportedLanguages: "English, Hindi, Hinglish",
  scoringHot: "70",
  scoringWarm: "40",
  scoringCold: "0",
  waTemplate: "Hi {{lead.name}}, thanks for speaking with us. Here is the onboarding link..."
};

export const adminApi = {
  getSettings: async () => {
    await delay(100);
    return { data: { ...memorySettings } };
  },
  updateSettings: async (newSettings: Partial<typeof memorySettings>) => {
    await delay(100);
    memorySettings = { ...memorySettings, ...newSettings };
    return { data: { ...memorySettings }, message: "Settings updated successfully" };
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
      },
    };
  },

  async getLeads(params: any) {
    const data = await apiRequest("/leads", { method: "GET" });
    let leads = (Array.isArray(data) ? data : []).map(mapLeadFromBackend);
    if (params.search) {
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(params.search.toLowerCase()) ||
          l.phone.includes(params.search),
      );
    }
    if (params.classification && params.classification !== "all") {
      leads = leads.filter((l) => l.classification === params.classification);
    }
    return {
      success: true,
      data: leads,
      pagination: {
        page: 1, limit: 20, total: leads.length, totalPages: 1,
      },
    };
  },

  async getLeadDetail(leadId: string) {
    const data = await apiRequest(`/leads/${leadId}`, { method: "GET" });
    const lead = mapLeadFromBackend(data.lead);
    const messages = (data.messages ?? []).map((message: any) => ({
      id: message.id,
      role: message.senderType === "ai" ? "assistant" : "user",
      content: message.messageText,
      sequenceNo: 1,
      timestamp: message.sentAt,
    }));
    return {
      success: true,
      data: {
        lead,
        campaign: { id: "campaign_1", name: "Rupeezy AP Campaign" },
        assignedRm: lead.assignedRm || null,
        latestConversation: data.latestChatThread
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
              readinessScore: Math.round(data.latestScore.readinessToSignupScore),
              engagementScore: Math.round(data.latestScore.interestLevelScore),
              fitScore: Math.round(data.latestScore.networkSizeScore),
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
          : null,
        rmTask: data.latestRmTask ?? null,
        followUp: data.latestFollowUp ?? null,
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
    const leads = await apiRequest("/leads", { method: "GET" });
    const leadRows = Array.isArray(leads) ? leads : [];
    const details = await Promise.all(
      leadRows.slice(0, 50).map(async (lead: any) => {
        try {
          return await apiRequest(`/leads/${lead.id}`, { method: "GET" });
        } catch {
          return null;
        }
      }),
    );

    const conversations = details
      .filter(Boolean)
      .flatMap((detail: any) => {
        const items: any[] = [];
        if (detail?.latestChatThread) {
          items.push({
            id: detail.latestChatThread.id,
            leadId: detail.lead.id,
            leadName: detail.lead.name,
            channel: "chat",
            language:
              detail.latestScore?.detectedLanguage ??
              detail.lead.preferredLanguage ??
              "unknown",
            status: detail.latestChatThread.status,
            durationSeconds: detail.latestScore?.durationSeconds ?? 0,
            classification:
              detail.latestScore?.classification ??
              detail.lead.finalInterestScore ??
              "cold",
            score: Math.round(detail.latestScore?.totalScore ?? 0),
            startedAt: detail.latestChatThread.startedAt,
          });
        }
        if (detail?.latestCallThread) {
          items.push({
            id: detail.latestCallThread.id,
            leadId: detail.lead.id,
            leadName: detail.lead.name,
            channel: "voice",
            language:
              detail.latestScore?.detectedLanguage ??
              detail.lead.preferredLanguage ??
              "unknown",
            status: detail.latestCallThread.status,
            durationSeconds: detail.latestCallThread.durationSeconds ?? detail.latestScore?.durationSeconds ?? 0,
            classification:
              detail.latestScore?.classification ??
              detail.lead.finalInterestScore ??
              "cold",
            score: Math.round(detail.latestScore?.totalScore ?? 0),
            startedAt: detail.latestCallThread.startedAt ?? detail.latestCallThread.requestedAt,
          });
        }
        return items;
      })
      .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());

    return {
      success: true,
      data: conversations,
      pagination: { page: 1, limit: 20, total: conversations.length, totalPages: 1 },
    };
  },

  async getConversationDetail(conversationId: string) {
    const leads = await apiRequest("/leads", { method: "GET" });
    const leadRows = Array.isArray(leads) ? leads : [];
    for (const lead of leadRows) {
      const detail = await apiRequest(`/leads/${lead.id}`, { method: "GET" });
      if (detail?.latestChatThread?.id === conversationId || detail?.latestCallThread?.id === conversationId) {
        const isCall = detail?.latestCallThread?.id === conversationId;
        return {
          success: true,
          data: {
            id: conversationId,
            leadId: detail.lead.id,
            leadName: detail.lead.name,
            channel: isCall ? "voice" : "chat",
            language: detail.latestScore?.detectedLanguage ?? detail.lead.preferredLanguage ?? "unknown",
            status: isCall ? detail.latestCallThread.status : detail.latestChatThread.status,
            durationSeconds: detail.latestScore?.durationSeconds ?? detail.latestCallThread?.durationSeconds ?? 0,
            classification: detail.latestScore?.classification ?? detail.lead.finalInterestScore ?? "cold",
            score: Math.round(detail.latestScore?.totalScore ?? 0),
            startedAt: isCall
              ? (detail.latestCallThread.startedAt ?? detail.latestCallThread.requestedAt)
              : detail.latestChatThread.startedAt,
            aiSummary: detail.latestScore?.overallSummary ?? detail.lead.overallSummary ?? "",
            keyObjection: detail.latestScore?.objections?.[0]?.type ?? "No objection captured",
            nextAction: detail.latestScore?.recommendedNextAction ?? detail.lead.recommendedNextAction ?? "",
            sentiment: detail.latestScore?.classification === "hot" ? "positive" : detail.latestScore?.classification === "warm" ? "neutral" : "hesitant",
            messages: (detail.messages ?? []).map((message: any) => ({
              role: message.senderType === "ai" ? "assistant" : "user",
              content: message.messageText,
              timestamp: message.sentAt,
            })),
            transcript: detail.latestCallThread?.transcript ?? null,
          },
        };
      }
    }

    throw new Error("Conversation not found");
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
    const [data, leadsData] = await Promise.all([
      apiRequest("/follow-ups", { method: "GET" }),
      apiRequest("/leads", { method: "GET" }),
    ]);
    const leads = new Map(
      (Array.isArray(leadsData) ? leadsData : []).map((lead: any) => [lead.id, mapLeadFromBackend(lead)]),
    );
    return {
      success: true,
      data: (Array.isArray(data) ? data : []).map((item: any) => {
        const lead = leads.get(item.leadId);
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
      pagination: { page: 1, limit: 20, total: Array.isArray(data) ? data.length : 0, totalPages: 1 },
    };
  },

  async syncFollowUps() {
    await delay(200);
    return { success: true };
  },

  async updateFollowUpStatus(followUpId: string, status: string) {
    const data = await apiRequest(`/follow-ups/${followUpId}/open-link`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    return { success: true, data };
  },

  async getKnowledgeDocuments(params: any = {}) {
    const data = await apiRequest("/knowledge-documents", { method: "GET" });
    return {
      success: true,
      data: data as any[],
      pagination: { page: 1, limit: 20, total: Array.isArray(data) ? data.length : 0, totalPages: 1 },
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
