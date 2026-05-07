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
      ? Math.round(raw.interestLevelScore + raw.readinessToSignupScore + raw.networkSizeScore)
      : 0;

  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    phoneE164: raw.phoneE164 ?? raw.phone,
    countryIso: raw.countryIso ?? "IN",
    countryCode: raw.countryCode ?? "+91",
    mobileNumberRaw: raw.mobileNumberRaw ?? "",
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
    mainObjection: raw.objections?.[0]?.type ?? "No objection captured",
    topicsCovered: raw.topicsCovered ?? [],
    interestLevelScore: raw.interestLevelScore ?? 0,
    readinessToSignupScore: raw.readinessToSignupScore ?? 0,
    networkSizeScore: raw.networkSizeScore ?? 0,
    waMeLink: raw.waMeLink ?? null,
  };
}

export const rmApi = {
  getRMDashboardOverview: async () => {
    const [leads, tasks, followUps] = await Promise.all([
      apiRequest("/leads", { method: "GET" }),
      apiRequest("/rm-tasks", { method: "GET" }),
      apiRequest("/follow-ups", { method: "GET" }),
    ]);
    const mapped = (Array.isArray(leads) ? leads : []).map(mapLead);
    const hotLeads = mapped.filter((lead: any) => lead.classification === "hot");
    const followUpsDue = mapped.filter((lead: any) => lead.classification === "warm");

    return {
      overview: {
        assignedHotLeads: hotLeads.length,
        pendingTasks: Array.isArray(tasks) ? tasks.filter((task: any) => task.status !== "completed").length : 0,
        followUpsDue: Array.isArray(followUps) ? followUps.length : followUpsDue.length,
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
    const score = data.latestScore
      ? {
          classification: data.latestScore.classification,
          totalScore: Math.round(data.latestScore.totalScore),
          readinessScore: Math.round(data.latestScore.readinessToSignupScore),
          engagementScore: Math.round(data.latestScore.interestLevelScore),
          fitScore: Math.round(data.latestScore.networkSizeScore),
          reason: data.latestScore.reason ?? "Lead analysis pending.",
          recommendedNextAction:
            data.latestScore.recommendedNextAction ?? "Follow up with this lead.",
          positiveSignals: data.latestScore.topicsCovered ?? [],
          negativeSignals: [],
          objections: data.latestScore.objections ?? [],
        }
      : {
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
          objections: data.lead.objections ?? [],
        };
    return {
      lead,
      messages: (data.messages ?? []).map((message: any) => ({
        id: message.id,
        role: message.senderType === "ai" ? "assistant" : "user",
        content: message.messageText,
      })),
      score,
      rmTask: data.latestRmTask ?? {
        suggestedOpeningLine:
          data.latestScore?.suggestedOpeningLine ??
          data.lead.handoffSummary ??
          "Continue from the AI summary and confirm the next step.",
      },
      followUp: data.latestFollowUp ?? null,
    };
  },

  createLead: async (payload: {
    name: string;
    countryIso: string;
    countryCode: string;
    mobileNumber: string;
    email?: string;
    address?: string;
    preferredLanguage?: string;
    preferredContactMethod?: "chat_now" | "call_under_5_min";
  }) => {
    const data = await apiRequest("/leads", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        countryIso: payload.countryIso,
        countryCode: payload.countryCode,
        mobileNumber: payload.mobileNumber,
        email: payload.email || "",
        address: payload.address || "",
        preferredLanguage: payload.preferredLanguage || "english",
        preferredContactMethod: payload.preferredContactMethod || "chat_now",
      }),
    });

    return mapLead(data.lead);
  },

  openFollowUpLink: async (followUpId: string) => {
    return await apiRequest(`/follow-ups/${followUpId}/open-link`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  scheduleLeadCall: async (leadId: string) => {
    return await apiRequest(`/leads/${leadId}/schedule-call`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  getRMFollowUps: async () => {
    const [followUps, leads] = await Promise.all([
      apiRequest("/follow-ups", { method: "GET" }),
      apiRequest("/leads", { method: "GET" }),
    ]);
    const leadMap = new Map(
      (Array.isArray(leads) ? leads : []).map((lead: any) => [lead.id, mapLead(lead)]),
    );

    return (Array.isArray(followUps) ? followUps : []).map((item: any) => {
      const lead = leadMap.get(item.leadId);
      return {
        id: item.id,
        leadId: item.leadId,
        leadName: lead?.name ?? "Unknown Lead",
        phone: lead?.phone ?? "",
        message: item.message,
        status: item.status,
        waLink: item.waMeLink,
        classification: lead?.classification ?? "warm",
      };
    });
  },
};
