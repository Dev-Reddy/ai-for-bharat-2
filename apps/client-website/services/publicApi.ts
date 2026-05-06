import { LeadData } from "@/store/leadSessionStore";
import { assertSupabaseConfigured, supabase } from "@/lib/supabase";

const API_BASE = `${
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
}/functions/v1/api`;

async function ensureAnonymousSession() {
  assertSupabaseConfigured();
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.access_token) {
    return sessionData.session.access_token;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.session?.access_token) {
    throw new Error(error?.message ?? "Unable to create anonymous session.");
  }

  return data.session.access_token;
}

async function publicRequest<T>(path: string, init: RequestInit = {}) {
  assertSupabaseConfigured();
  const accessToken = await ensureAnonymousSession();
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

  return payload.data as T;
}

export type PublicLeadCreateResponse = {
  lead: {
    id: string;
    name: string;
    phone: string;
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

export const createPublicLead = async (data: LeadData) => {
  return await publicRequest<PublicLeadCreateResponse>("/public/leads", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      address: data.address || "",
      preferredLanguage: data.preferredLanguage || "english",
      preferredContactMethod: data.preferredContactMethod || "chat_now",
      whatsappConsent: Boolean(data.whatsappConsent),
    }),
  });
};

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
  );
}

export async function sendPublicChatMessage(threadId: string, messageText: string) {
  return await publicRequest<{
    userMessage: unknown;
    assistantMessage: { id: string; messageText: string };
    lead: Record<string, unknown>;
    conversationComplete: boolean;
  }>(`/public/chat-threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messageText,
    }),
  });
}

export async function endPublicChat(threadId: string) {
  return await publicRequest<{ lead: Record<string, unknown>; conversationComplete: boolean }>(
    `/public/chat-threads/${threadId}/end`,
    {
      method: "POST",
    },
  );
}

export async function startPublicLeadChat(leadId: string) {
  return await publicRequest<{
    lead: PublicLeadCreateResponse["lead"];
    chatThread: NonNullable<PublicLeadCreateResponse["chatThread"]>;
    assistantMessage: PublicLeadCreateResponse["assistantMessage"];
  }>(`/public/leads/${leadId}/start-chat`, {
    method: "POST",
  });
}

export { ensureAnonymousSession };
