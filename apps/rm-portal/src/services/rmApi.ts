import { supabase } from "../lib/supabase";

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

function mapLead(raw: any) {
  const latestScore =
    typeof raw.interestLevelScore === "number" &&
    typeof raw.readinessToSignupScore === "number" &&
    typeof raw.networkSizeScore === "number"
      ? Math.round(
          (raw.interestLevelScore + raw.readinessToSignupScore + raw.networkSizeScore) / 3,
        )
      : 0;

  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    email: raw.email ?? undefined,
    city: raw.address ?? "",
    role: "Partner Lead",
    networkSize: raw.networkSize ?? "",
    preferredLanguage: raw.preferredLanguage ?? "english",
    preferredChannel:
      raw.preferredContactMethod === "call_under_5_min" ? "voice" : "chat",
    whatsappConsent: true,
    status:
      raw.progressStatus === "assigned"
        ? "assigned_to_rm"
        : raw.progressStatus === "converted"
          ? "converted"
          : raw.contactStatus === "pending"
            ? "pending_contact"
            : "conversation_completed",
    classification: raw.finalInterestScore ?? "cold",
    latestScore,
    latestSummary: raw.overallSummary ?? "",
    latestNextAction: raw.recommendedNextAction ?? "",
    handoffSummary: raw.handoffSummary ?? "",
    objections: raw.objections ?? [],
    mainObjection: raw.objections?.[0] ?? "No objection captured",
    topicsCovered: raw.topicsCovered ?? [],
    interestLevelScore: raw.interestLevelScore ?? 0,
    readinessToSignupScore: raw.readinessToSignupScore ?? 0,
    networkSizeScore: raw.networkSizeScore ?? 0,
  };
}

export const rmApi = {
  getRMDashboardOverview: async () => {
    const leads = await apiRequest("/leads", { method: "GET" });
    const mapped = (Array.isArray(leads) ? leads : []).map(mapLead);
    const hotLeads = mapped.filter((lead: any) => lead.classification === "hot");
    const followUpsDue = mapped.filter((lead: any) => lead.classification === "warm");

    return {
      overview: {
        assignedHotLeads: hotLeads.length,
        pendingTasks: mapped.filter((lead: any) => lead.status !== "converted").length,
        followUpsDue: followUpsDue.length,
        convertedLeads: mapped.filter((lead: any) => lead.status === "converted").length,
        closedLeads: mapped.filter((lead: any) => lead.classification === "cold").length,
        averageLeadScore:
          mapped.length > 0
            ? Math.round(
                mapped.reduce((sum: number, lead: any) => sum + lead.latestScore, 0) /
                  mapped.length,
              )
            : 0,
      },
      hotLeads,
      followUpsDue,
      notifications: [],
    };
  },

  getRMLeads: async () => {
    const data = await apiRequest("/leads", { method: "GET" });
    return (Array.isArray(data) ? data : []).map(mapLead);
  },

  getRMHotLeads: async () => {
    const leads = await rmApi.getRMLeads();
    return leads.filter((lead: any) => lead.classification === "hot");
  },

  getRMLeadDetail: async (leadId: string) => {
    const data = await apiRequest(`/leads/${leadId}`, { method: "GET" });
    const lead = mapLead(data.lead);
    return {
      lead,
      messages: (data.messages ?? []).map((message: any) => ({
        id: message.id,
        role: message.senderType === "ai" ? "assistant" : "user",
        content: message.messageText,
      })),
      score: {
        classification: lead.classification,
        totalScore: lead.latestScore,
        readinessScore: lead.readinessToSignupScore,
        engagementScore: lead.interestLevelScore,
        fitScore: lead.networkSizeScore,
        reason: data.lead.reason ?? "Lead analysis pending.",
        recommendedNextAction:
          data.lead.recommendedNextAction ?? "Follow up with this lead.",
        positiveSignals: data.lead.topicsCovered ?? [],
        negativeSignals: [],
        objections: (data.lead.objections ?? []).map((objection: string) => ({
          type: objection,
          leadStatement: objection,
        })),
      },
      rmTask: {
        suggestedOpeningLine:
          data.lead.handoffSummary ??
          "Continue from the AI summary and confirm the next step.",
      },
    };
  },

  createLead: async (payload: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    preferredLanguage?: string;
    preferredContactMethod?: "chat_now" | "call_under_5_min";
  }) => {
    const data = await apiRequest("/leads", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        phone: payload.phone,
        email: payload.email || "",
        address: payload.address || "",
        preferredLanguage: payload.preferredLanguage || "english",
        preferredContactMethod: payload.preferredContactMethod || "chat_now",
      }),
    });

    return mapLead(data.lead);
  },
};
