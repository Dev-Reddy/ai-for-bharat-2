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
    typeof raw.latestScoreBreakdown?.totalScore === "number"
      ? Math.round(raw.latestScoreBreakdown.totalScore)
      : typeof raw.latestScore === "number"
        ? raw.latestScore
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
    classification: raw.finalInterestScore ?? raw.latestScoreBreakdown?.classification ?? "cold",
    latestScore,
    latestSummary: raw.overallSummary ?? "",
    latestNextAction: raw.recommendedNextAction ?? "",
    handoffSummary: raw.handoffSummary ?? "",
    objections: raw.objections ?? [],
    mainObjection: raw.objections?.[0]?.type ?? "No objection captured",
    topicsCovered: raw.topicsCovered ?? [],
    interestLevelScore: raw.latestScoreBreakdown?.interestLevelScore ?? raw.interestLevelScore ?? 0,
    readinessToSignupScore: raw.latestScoreBreakdown?.readinessToSignupScore ?? raw.readinessToSignupScore ?? 0,
    networkSizeScore: raw.latestScoreBreakdown?.networkSizeScore ?? raw.networkSizeScore ?? 0,
    waMeLink: raw.waMeLink ?? raw.leadWaMeLink ?? null,
    canStartCall: Boolean(raw.canStartCall ?? !raw.hasAnyCall),
  };
}

export const rmApi = {
  getRMDashboardOverview: async () => {
    const [overview, funnel, classificationBreakdown, languageBreakdown, objectionBreakdown] = await Promise.all([
      apiRequest("/analytics/overview?period=all_time", { method: "GET" }),
      apiRequest("/analytics/funnel?period=all_time", { method: "GET" }),
      apiRequest("/analytics/classification-breakdown?period=all_time", { method: "GET" }),
      apiRequest("/analytics/language-breakdown?period=all_time", { method: "GET" }),
      apiRequest("/analytics/objection-breakdown?period=all_time", { method: "GET" }),
    ]);
    const leads = await rmApi.getRMLeads();
    const hotLeads = leads.filter((lead: any) => lead.classification === "hot");

    return {
      overview: {
        assignedHotLeads: overview.overview.hot,
        pendingTasks: overview.rmLoad?.[0]?.pendingTaskCount ?? 0,
        followUpsDue: overview.overview.followUpsScheduled,
        convertedLeads: overview.overview.converted,
        closedLeads: overview.overview.cold,
        averageLeadScore: overview.leadScoreRows?.length
          ? Math.round(overview.leadScoreRows.reduce((sum: number, row: any) => sum + row.totalScore, 0) / overview.leadScoreRows.length)
          : 0,
      },
      hotLeads,
      followUpsDue: [],
      notifications: [],
      funnel,
      classificationBreakdown,
      languageBreakdown,
      objectionBreakdown,
      scoreBreakdown: overview.scoreBreakdown ?? [],
      scoreDimensionAverages: overview.scoreDimensionAverages ?? {},
    };
  },

  getRMLeads: async (params: Record<string, unknown> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
    const data = await apiRequest(`/leads${query.toString() ? `?${query.toString()}` : ""}`, { method: "GET" });
    return (Array.isArray(data.data) ? data.data : []).map(mapLead);
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
      messages: data.latestTranscriptSource === "call_thread"
        ? String(data.latestTranscript ?? "")
          .split("\n")
          .filter(Boolean)
          .map((line: string, index: number) => {
            const [speaker, ...rest] = line.split(":");
            return {
              id: `${leadId}-call-${index}`,
              role: speaker.toLowerCase().includes("ai") ? "assistant" : "user",
              content: rest.join(":").trim(),
            };
          })
        : (data.messages ?? []).map((message: any) => ({
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
      canStartCall: data.lead.canStartCall,
      leadWaMeLink: data.lead.leadWaMeLink,
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

  updateFollowUpMessage: async (followUpId: string, message: string) => {
    return await apiRequest(`/follow-ups/${followUpId}`, {
      method: "PATCH",
      body: JSON.stringify({ message }),
    });
  },

  scheduleLeadCall: async (leadId: string) => {
    return await apiRequest(`/leads/${leadId}/schedule-call`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  runLeadAnalysis: async (leadId: string) => {
    return await apiRequest(`/leads/${leadId}/run-analysis`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  getRMFollowUps: async () => {
    const followUps = await apiRequest("/follow-ups?page=1&pageSize=100", { method: "GET" });

    return (Array.isArray(followUps.data) ? followUps.data : []).map((item: any) => {
      const lead = item.lead ?? null;
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
