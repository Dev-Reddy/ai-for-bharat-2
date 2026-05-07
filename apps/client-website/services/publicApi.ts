import { assertSupabaseConfigured, getSupabaseClient } from "@/lib/supabase";
import { LeadData } from "@/store/leadSessionStore";

const API_BASE = `${
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
}/functions/v1/api`;

type PublicSession = {
  accessToken: string | null;
  userId: string | null;
};

let anonymousAuthUnavailable = false;

async function getExistingPublicSession(): Promise<PublicSession> {
  assertSupabaseConfigured();
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session?.access_token || !data.session.user?.id) {
    return {
      accessToken: null,
      userId: null,
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.id) {
    console.warn("Discarding invalid persisted Supabase public session.", userError);
    await supabase.auth.signOut();
    return {
      accessToken: null,
      userId: null,
    };
  }

  supabase.realtime.setAuth(data.session.access_token);

  return {
    accessToken: data.session.access_token,
    userId: userData.user.id,
  };
}

export async function ensurePublicChatSession(): Promise<PublicSession> {
  const existingSession = await getExistingPublicSession();
  if (existingSession.accessToken) {
    return existingSession;
  }

  if (anonymousAuthUnavailable) {
    return {
      accessToken: null,
      userId: null,
    };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session?.access_token || !data.user?.id) {
    if (error && "code" in error && error.code === "anonymous_provider_disabled") {
      anonymousAuthUnavailable = true;
    }
    console.warn("Anonymous Supabase auth unavailable for public chat.", error);
    return {
      accessToken: null,
      userId: null,
    };
  }

  supabase.realtime.setAuth(data.session.access_token);

  return {
    accessToken: data.session.access_token,
    userId: data.user.id,
  };
}

async function publicRequest<T>(
  path: string,
  init: RequestInit = {},
  options: {
    requireSession?: boolean;
  } = {},
) {
  assertSupabaseConfigured();
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "placeholder-publishable-key";
  const session = options.requireSession
    ? await ensurePublicChatSession()
    : await getExistingPublicSession();

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      ...(session.accessToken
        ? {
            Authorization: `Bearer ${session.accessToken}`,
          }
        : {}),
      ...(init.headers ?? {}),
    },
  });

  const rawPayload = await response.text();
  const payload = rawPayload ? safeJsonParse(rawPayload) : null;

  if (!response.ok || !payload || payload.success !== true) {
    const errorMessage =
      payload && typeof payload === "object" && "error" in payload
        ? getApiErrorMessage(payload)
        : `Request failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  return payload.data as T;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function getApiErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return "Request failed.";
}

export type PublicLeadCreateResponse = {
  lead: {
    id: string;
    name: string;
    phone: string;
    phoneE164: string;
    countryIso: string;
    countryCode: string;
    mobileNumberRaw: string;
    email?: string | null;
    address?: string | null;
    preferredLanguage?: string | null;
    preferredContactMethod: "chat_now" | "call_under_5_min";
    finalInterestScore?: "hot" | "warm" | "cold" | null;
    overallSummary?: string | null;
  };
  chatThread: {
    id: string;
    channelTopic: string;
    status: string;
  } | null;
  callThread: {
    id: string;
    status: string;
    requestedAt: string;
    callDueAt: string;
  } | null;
  assistantMessage: {
    id: string;
    threadId: string;
    senderType: string;
    messageText: string;
    sentAt: string;
  } | null;
};

export async function createPublicLead(data: LeadData) {
  return await publicRequest<PublicLeadCreateResponse>(
    "/public/client-leads",
    {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        countryIso: data.countryIso,
        countryCode: data.countryCode,
        mobileNumber: data.mobileNumber,
        email: data.email || "",
        address: data.address || "",
        preferredLanguage: data.preferredLanguage || "english",
        preferredContactMethod: data.preferredContactMethod || "chat_now",
      }),
    },
    {
      requireSession: true,
    },
  );
}

export type PublicThreadMessagesResponse = {
  thread: {
    id: string;
    leadId: string;
    channelTopic: string;
    status: string;
    startedAt: string;
    endedAt?: string | null;
  };
  messages: Array<{
    id: string;
    threadId: string;
    senderType: string;
    senderId?: string | null;
    receiverType: string;
    receiverId?: string | null;
    messageText: string;
    metadata?: Record<string, unknown>;
    sentAt: string;
  }>;
};

export async function getPublicThreadMessages(threadId: string) {
  return await publicRequest<PublicThreadMessagesResponse>(
    `/public/chat-threads/${threadId}/messages`,
    {
      method: "GET",
    },
    {
      requireSession: true,
    },
  );
}

export async function sendPublicChatMessage(threadId: string, messageText: string) {
  return await publicRequest<{
    userMessage: unknown;
    assistantMessage: { id: string; messageText: string };
    lead: Record<string, unknown>;
    conversationComplete: boolean;
  }>(
    `/public/chat-threads/${threadId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        messageText,
      }),
    },
    {
      requireSession: true,
    },
  );
}

export async function endPublicChat(threadId: string) {
  return await publicRequest<{ lead: Record<string, unknown>; conversationComplete: boolean }>(
    `/public/chat-threads/${threadId}/end`,
    {
      method: "POST",
    },
    {
      requireSession: true,
    },
  );
}

export async function startPublicLeadChat(leadId: string) {
  return await publicRequest<{
    lead: PublicLeadCreateResponse["lead"];
    chatThread: NonNullable<PublicLeadCreateResponse["chatThread"]>;
    assistantMessage: PublicLeadCreateResponse["assistantMessage"];
  }>(
    `/public/leads/${leadId}/start-chat`,
    {
      method: "POST",
    },
    {
      requireSession: true,
    },
  );
}
