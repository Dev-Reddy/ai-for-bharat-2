import { API_BASE, supabase } from "../lib/supabase";

export type RMDashboardPeriod = "daily" | "weekly" | "monthly" | "all_time";

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

type RawLead = {
  latestScoreBreakdown?: {
    totalScore?: number;
    classification?: string;
    interestLevelScore?: number;
    readinessToSignupScore?: number;
    networkSizeScore?: number;
  };
  latestScore?: number;
  progressStatus?: string;
  contactStatus?: string;
  preferredContactMethod?: string;
  hasAnyCall?: boolean;
  id: string;
  name: string;
  phone: string;
  phoneE164?: string;
  countryIso?: string;
  countryCode?: string;
  mobileNumberRaw?: string;
  email?: string;
  address?: string;
  networkSize?: string;
  preferredLanguage?: string;
  overallSummary?: string;
  recommendedNextAction?: string;
  handoffSummary?: string;
  objections?: Array<{ type?: string } & Record<string, unknown>>;
  topicsCovered?: string[];
  interestLevelScore?: number;
  readinessToSignupScore?: number;
  networkSizeScore?: number;
  source?: string;
  sourceLabel?: string;
  createdByUserId?: string | null;
  createdByUser?: { id: string; name: string; email: string } | null;
  assignedRm?: { id: string; name: string; email: string } | null;
  canStartCall?: boolean;
  leadWaMeLink?: string | null;
  latestTranscriptSource?: string | null;
  latestTranscript?: string | null;
  createdAt?: string;
  updatedAt?: string;
  waMeLink?: string | null;
  finalInterestScore?: string;
};

type RawFollowUp = {
  id: string;
  leadId: string;
  message: string;
  status: string;
  createdAt: string;
  waMeLink?: string | null;
  lead?: {
    name?: string;
    phone?: string;
    preferredLanguage?: string;
  } | null;
};

/** Maps API lead row to admin-parity shape for RM portal UI. */
export function mapLead(raw: RawLead) {
  const scoreBreakdown = raw.latestScoreBreakdown ?? {};
  const latestScore =
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
    status,
    classification: raw.finalInterestScore ?? scoreBreakdown.classification ?? "cold",
    latestScore,
    latestSummary: raw.overallSummary ?? "",
    latestNextAction: raw.recommendedNextAction ?? "",
    handoffSummary: raw.handoffSummary ?? "",
    objections: raw.objections ?? [],
    mainObjection: raw.objections?.[0]?.type ?? "No objection captured",
    topicsCovered: raw.topicsCovered ?? [],
    interestLevelScore: scoreBreakdown.interestLevelScore ?? raw.interestLevelScore ?? 0,
    readinessToSignupScore: scoreBreakdown.readinessToSignupScore ?? raw.readinessToSignupScore ?? 0,
    networkSizeScore: scoreBreakdown.networkSizeScore ?? raw.networkSizeScore ?? 0,
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
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
    waMeLink: raw.waMeLink ?? raw.leadWaMeLink ?? null,
  };
}

export const rmApi = {
  getRMDashboardOverview: async (period: RMDashboardPeriod = "all_time") => {
    const [overview, funnel, classificationBreakdown, languageBreakdown, objectionBreakdown] =
      await Promise.all([
        apiRequest(`/analytics/overview?period=${period}`, { method: "GET" }),
        apiRequest(`/analytics/funnel?period=${period}`, { method: "GET" }),
        apiRequest(`/analytics/classification-breakdown?period=${period}`, { method: "GET" }),
        apiRequest(`/analytics/language-breakdown?period=${period}`, { method: "GET" }),
        apiRequest(`/analytics/objection-breakdown?period=${period}`, { method: "GET" }),
      ]);
    const hotLeads = await rmApi.getRMHotLeads();

    return {
      overview: {
        totalLeads: overview.overview?.totalLeads ?? 0,
        conversationCompleted: overview.overview?.conversationCompleted ?? 0,
        assignedHotLeads: hotLeads.length,
        pendingTasks: overview.rmLoad?.[0]?.pendingTaskCount ?? 0,
        followUpsDue: overview.overview?.followUpsScheduled ?? 0,
        convertedLeads: overview.overview?.converted ?? 0,
        closedLeads: overview.overview?.cold ?? 0,
        averageLeadScore: overview.leadScoreRows?.length
          ? Math.round(
              overview.leadScoreRows.reduce((sum: number, row: { totalScore: number }) => sum + row.totalScore, 0) /
                overview.leadScoreRows.length,
            )
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
    const query = buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      classification: params.classification,
      status: params.status,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const data = await apiRequest(`/leads${query}`, { method: "GET" });
    const rows = Array.isArray(data.data) ? data.data : [];
    return {
      data: rows.map(mapLead),
      pagination: data.pagination ?? {
        page: 1,
        totalPages: 1,
        total: rows.length,
        pageSize: Number(params.pageSize ?? 20),
      },
    };
  },

  getRMHotLeads: async () => {
    const { data } = await rmApi.getRMLeads({ classification: "hot", page: 1, pageSize: 100 });
    return [...data]
      .sort((left, right) => {
        if (right.latestScore !== left.latestScore) {
          return right.latestScore - left.latestScore;
        }

        return new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() - new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
      })
      .slice(0, 8);
  },

  getRMLeadDetail: async (leadId: string) => {
    const data = await apiRequest(`/leads/${leadId}`, { method: "GET" });
    const lead = mapLead(data.lead);
    const score = data.latestScore
      ? {
          id: data.latestScore.id,
          classification: data.latestScore.classification,
          totalScore: Math.round(data.latestScore.totalScore),
          interestLevelScore: Math.round(data.latestScore.interestLevelScore),
          readinessToSignupScore: Math.round(data.latestScore.readinessToSignupScore),
          networkSizeScore: Math.round(data.latestScore.networkSizeScore),
          readinessScore: Math.round(data.latestScore.readinessToSignupScore),
          engagementScore: Math.round(data.latestScore.interestLevelScore),
          fitScore: Math.round(data.latestScore.networkSizeScore),
          reason: data.latestScore.reason ?? "Lead analysis pending.",
          detectedLanguage: data.latestScore.detectedLanguage ?? null,
          recommendedNextAction:
            data.latestScore.recommendedNextAction ?? "Follow up with this lead.",
          suggestedOpeningLine: data.latestScore.suggestedOpeningLine ?? "",
          handoffSummary: data.latestScore.handoffSummary ?? "",
          positiveSignals: data.latestScore.topicsCovered ?? [],
          negativeSignals: [] as string[],
          objections: data.latestScore.objections ?? [],
        }
      : {
          classification: lead.classification,
          totalScore: lead.latestScore,
          interestLevelScore: lead.interestLevelScore,
          readinessToSignupScore: lead.readinessToSignupScore,
          networkSizeScore: lead.networkSizeScore,
          readinessScore: lead.readinessToSignupScore,
          engagementScore: lead.interestLevelScore,
          fitScore: lead.networkSizeScore,
          reason: (data.lead as { reason?: string }).reason ?? "Lead analysis pending.",
          detectedLanguage: lead.preferredLanguage ?? null,
          recommendedNextAction:
            (data.lead as { recommendedNextAction?: string }).recommendedNextAction ??
            "Follow up with this lead.",
          suggestedOpeningLine: "",
          handoffSummary: lead.handoffSummary ?? "",
          positiveSignals: (data.lead as { topicsCovered?: string[] }).topicsCovered ?? [],
          negativeSignals: [] as string[],
          objections: (data.lead as { objections?: unknown[] }).objections ?? [],
        };

    return {
      lead,
      messages:
        data.latestTranscriptSource === "call_thread"
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
          : (data.messages ?? []).map((message: { id: string; senderType: string; messageText: string }) => ({
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
        recommendedAction:
          data.latestScore?.recommendedNextAction ?? "Review transcript and decide next step.",
      },
      followUp: data.latestFollowUp ?? null,
      canStartCall: data.lead.canStartCall,
      leadWaMeLink: data.lead.leadWaMeLink,
      latestTranscriptSource: data.latestTranscriptSource ?? null,
      latestTranscript: data.latestTranscript ?? null,
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

    return (Array.isArray(followUps.data) ? followUps.data : []).map((item: RawFollowUp) => {
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
