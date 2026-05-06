import { MOCK_ADMIN, MOCK_CLIENT, MOCK_LEADS, MOCK_RMS, MOCK_CONVERSATIONS, MOCK_CAMPAIGNS, MOCK_FOLLOWUPS, MOCK_KNOWLEDGE_DOCS, MOCK_FEEDBACK } from "../mocks/admin.mock";
import { Lead, User } from "../types/admin.types";
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
      ? Math.round(
          (raw.interestLevelScore + raw.readinessToSignupScore + raw.networkSizeScore) / 3,
        )
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
    email: raw.email ?? undefined,
    city: raw.address ?? undefined,
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
    await delay(200);
    return { data: { ...memorySettings } };
  },
  updateSettings: async (newSettings: Partial<typeof memorySettings>) => {
    await delay(400);
    memorySettings = { ...memorySettings, ...newSettings };
    return { data: { ...memorySettings }, message: "Settings updated successfully" };
  },
  async loginAdmin() {
    throw new Error("Use authApi.login instead.");
  },

  async getAdminDashboardOverview(period: "daily" | "weekly" | "monthly" | "all_time" = "all_time") {
    await delay(500);
    // Simulate dynamic data based on period
    const multiplier = period === "daily" ? 1 : period === "weekly" ? 5 : period === "monthly" ? 20 : 50;
    
    return {
      success: true,
      data: {
        overview: {
          totalLeads: 5 * multiplier,
          conversationCompleted: 3 * multiplier,
          hot: 1 * multiplier,
          warm: 2 * multiplier,
          cold: 2 * multiplier,
          assignedToRm: 1 * multiplier,
          followUpsScheduled: 2 * multiplier,
          converted: Math.floor(0.5 * multiplier),
        },
        funnel: [
          { stage: "new", label: "New", count: 5 * multiplier },
          { stage: "conversation_completed", label: "Conversation Completed", count: 3 * multiplier },
          { stage: "assigned_to_rm", label: "Assigned to RM", count: 1 * multiplier },
          { stage: "follow_up_scheduled", label: "Follow Up Scheduled", count: 2 * multiplier },
          { stage: "converted", label: "Converted", count: Math.floor(0.5 * multiplier) },
        ],
        languageStats: [
          { language: "Hindi", count: 2 * multiplier },
          { language: "English", count: 1 * multiplier },
          { language: "Hinglish", count: 2 * multiplier },
        ],
        objectionStats: [
          { type: "Existing Broker", count: 14 * multiplier, resolved: 10 * multiplier, unresolved: 4 * multiplier },
          { type: "Not Enough Contacts", count: 9 * multiplier, resolved: 6 * multiplier, unresolved: 3 * multiplier },
          { type: "Trust Concern", count: 6 * multiplier, resolved: 4 * multiplier, unresolved: 2 * multiplier },
        ],
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
        score: {
          id: `score_${lead.id}`,
          classification: lead.classification,
          totalScore: lead.latestScore,
          readinessScore: data.lead.readinessToSignupScore ?? 0,
          engagementScore: data.lead.interestLevelScore ?? 0,
          fitScore: data.lead.networkSizeScore ?? 0,
          reason: data.lead.reason ?? "Lead analysis pending.",
          recommendedNextAction:
            data.lead.recommendedNextAction ?? "Review the lead and decide the next step.",
          positiveSignals: data.lead.topicsCovered ?? [],
          negativeSignals: [],
          objections: (data.lead.objections ?? []).map((objection: string) => ({
            type: objection,
            status: "captured",
            leadStatement: objection,
            aiResponseSummary: lead.latestSummary ?? "See transcript for details.",
          })),
        },
        rmTask: lead.assignedRm
          ? {
              id: `task_${lead.id}`,
              status: lead.status === "converted" ? "converted" : "pending",
              priority: lead.classification === "hot" ? "high" : "normal",
              recommendedAction:
                data.lead.recommendedNextAction ?? "Follow up with this lead.",
              suggestedOpeningLine:
                data.lead.handoffSummary ??
                "Continue naturally from the AI conversation summary.",
            }
          : null,
        followUp: data.latestCallThread
          ? {
              id: data.latestCallThread.id,
              status: data.latestCallThread.status,
              transcript: data.latestCallThread.transcript,
            }
          : null,
      },
    };
  },

  async addLead(payload: any) {
    const data = await apiRequest("/leads", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        phone: payload.phone,
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

  async assignRm(leadId: string, rmId: string) {
    await apiRequest(`/leads/${leadId}/assign-rm`, {
      method: "POST",
      body: JSON.stringify({ assignedRmId: rmId }),
    });
    return { success: true };
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
    await delay(400);
    return { success: true, data: memoryConversations, pagination: { page: 1, limit: 20, total: memoryConversations.length, totalPages: 1 } };
  },

  async getConversationDetail(conversationId: string) {
    await delay(400);
    const conv = memoryConversations.find(c => c.id === conversationId);
    if (!conv) throw new Error("Conversation not found");

    return {
      success: true,
      data: {
        ...conv,
        aiSummary: "The lead was very interested in the onboarding process and requested more details.",
        keyObjection: "Found another broker with lower fees",
        nextAction: "Send competitive fee comparison via WhatsApp",
        sentiment: "positive",
        messages: [
          { role: 'assistant', content: 'Hi there! How can I help you today?', timestamp: new Date(Date.now() - 600000).toISOString() },
          { role: 'user', content: 'I am looking for a new broker, but I heard your fees are high.', timestamp: new Date(Date.now() - 500000).toISOString() },
          { role: 'assistant', content: 'We actually have zero account opening fees and provide daily payouts. Would you like the full fee breakdown?', timestamp: new Date(Date.now() - 400000).toISOString() },
          { role: 'user', content: 'Yes please. Send it via WhatsApp.', timestamp: new Date(Date.now() - 300000).toISOString() },
          { role: 'assistant', content: 'Sure, I will have a relationship manager send that to you right away.', timestamp: new Date(Date.now() - 200000).toISOString() }
        ]
      }
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
    await delay(400);
    return { success: true, data: memoryFollowUps, pagination: { page: 1, limit: 20, total: memoryFollowUps.length, totalPages: 1 } };
  },

  async syncFollowUps() {
    await delay(800);
    // Simulate updating timestamps and statuses
    memoryFollowUps = memoryFollowUps.map(f => ({
      ...f,
      status: Math.random() > 0.5 ? "sent" : "ready",
      createdAt: new Date().toISOString()
    }));
    return { success: true };
  },

  async updateFollowUpStatus(followUpId: string, status: string) {
    await delay(300);
    memoryFollowUps = memoryFollowUps.map(f => f.id === followUpId ? { ...f, status: status as any } : f);
    return { success: true };
  },

  async getKnowledgeDocuments(params: any = {}) {
    await delay(300);
    return { success: true, data: memoryKnowledgeDocs, pagination: { page: 1, limit: 20, total: memoryKnowledgeDocs.length, totalPages: 1 } };
  },
  
  async addKnowledgeDocument(payload: any) {
    await delay(400);
    const newDoc = {
      id: "doc_" + Date.now(),
      title: payload.title,
      type: payload.type,
      isActive: true,
      updatedAt: new Date().toISOString()
    };
    memoryKnowledgeDocs = [newDoc, ...memoryKnowledgeDocs];
    return { success: true, data: newDoc };
  },

  async updateKnowledgeDocument(id: string, payload: any) {
    await delay(400);
    memoryKnowledgeDocs = memoryKnowledgeDocs.map(doc => doc.id === id ? { ...doc, title: payload.title, type: payload.type, updatedAt: new Date().toISOString() } : doc);
    return { success: true };
  },

  async deleteKnowledgeDocument(id: string) {
    await delay(400);
    memoryKnowledgeDocs = memoryKnowledgeDocs.filter(doc => doc.id !== id);
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
    await delay(400);
    return { success: true, data: memoryRMs };
  }
};
