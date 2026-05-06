import { z } from "npm:zod@^4.1.12";
import { embed, generateObject, streamText } from "npm:ai";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google";
import { Annotation, END, START, StateGraph } from "npm:@langchain/langgraph";
import type { AuthContext } from "./auth.ts";
import { env } from "./env.ts";
import { getServiceClient } from "./supabase.ts";

const google = createGoogleGenerativeAI({
  apiKey: env.geminiApiKey,
});

const fallbackKnowledgeDocuments = [
  {
    title: "Rupeezy AP Program Overview",
    content:
      "Rupeezy partner program helps MFDs, financial advisors, insurance agents, and finance influencers onboard retail clients under Rupeezy's broker license as Authorized Persons. Key benefits: zero joining fee, 100 percent brokerage share, daily payouts via RISE Portal, onboarding guidance, and ongoing support.",
  },
  {
    title: "Core Objections",
    content:
      "If lead says they already work with another broker, acknowledge their experience and compare revenue share and payout speed. If lead says they do not have enough contacts, explain they can start small with relevant investor or finance contacts. If lead worries about client support, explain Rupeezy support and RM assistance. If lead questions trust, respond with factual onboarding and support details without inventing unsupported claims. If lead wants to think or call later, capture the best next step and offer call or chat follow-up.",
  },
  {
    title: "Call Handling",
    content:
      "Always adapt to Hindi, English, or Hinglish. Keep the pitch concise, ask one question at a time, and end with a clear next step such as RM callback, AI follow-up call, or reviewing details later.",
  },
];

export const publicLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  role: z.string().optional(),
  networkSize: z.string().optional(),
  preferredLanguage: z.string().optional(),
  preferredContactMethod: z.enum(["chat_now", "call_under_5_min"]),
  whatsappConsent: z.boolean().optional(),
});

export const manualLeadSchema = publicLeadSchema.extend({
  assignedRmId: z.string().uuid().optional(),
});

export const chatMessageSchema = z.object({
  messageText: z.string().min(1).max(4000),
});

export const scheduleCallSchema = z.object({
  dueAt: z.string().datetime().optional(),
  triggerSource: z
    .enum(["chat_followup", "call_followup", "admin_manual", "rm_manual"])
    .optional(),
});

export const assignRmSchema = z.object({
  assignedRmId: z.string().uuid(),
});

const analysisSchema = z.object({
  conversationComplete: z.boolean(),
  shouldScheduleFollowUpCall: z.boolean().default(false),
  interestLevelScore: z.number().min(0).max(100),
  readinessToSignupScore: z.number().min(0).max(100),
  networkSizeScore: z.number().min(0).max(100),
  finalInterestScore: z.enum(["hot", "warm", "cold"]),
  reason: z.string(),
  objections: z.array(z.string()).default([]),
  topicsCovered: z.array(z.string()).default([]),
  recommendedNextAction: z.string(),
  handoffSummary: z.string(),
  overallSummary: z.string(),
});

type PublicLeadInput = z.infer<typeof publicLeadSchema>;
type ManualLeadInput = z.infer<typeof manualLeadSchema>;
type ChatMessageInput = z.infer<typeof chatMessageSchema>;
type ScheduleCallInput = z.infer<typeof scheduleCallSchema>;
type AssignRmInput = z.infer<typeof assignRmSchema>;

type LeadRow = {
  id: string;
  public_auth_user_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  source: string;
  preferred_language: string | null;
  preferred_contact_method: "chat_now" | "call_under_5_min";
  assigned_rm_id: string | null;
  contact_status: string;
  progress_status: string;
  call_due_at: string | null;
  last_contacted_at: string | null;
  interest_level_score: number | null;
  readiness_to_signup_score: number | null;
  network_size_score: number | null;
  final_interest_score: "hot" | "warm" | "cold" | null;
  reason: string | null;
  objections: string[] | null;
  topics_covered: string[] | null;
  recommended_next_action: string | null;
  handoff_summary: string | null;
  overall_summary: string | null;
  created_at: string;
  updated_at: string;
  assigned_rm?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type ChatThreadRow = {
  id: string;
  lead_id: string;
  public_auth_user_id: string | null;
  channel_topic: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_type: string;
  sender_id: string | null;
  receiver_type: string;
  receiver_id: string | null;
  message_text: string;
  metadata: Record<string, unknown> | null;
  sent_at: string;
};

type CallThreadRow = {
  id: string;
  lead_id: string;
  rm_id: string | null;
  vapi_call_id: string | null;
  trigger_source: string;
  status: string;
  requested_at: string;
  call_due_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  provider_payload: Record<string, unknown> | null;
  attempt_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

const queryGraphState = Annotation.Root({
  userMessage: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => "",
  }),
  refinedQueries: Annotation<string[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  knowledgeSnippets: Annotation<string[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  memorySnippets: Annotation<string[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
});

const analysisGraphState = Annotation.Root({
  transcript: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => "",
  }),
  normalizedTranscript: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => "",
  }),
});

let compiledQueryGraph: Promise<any> | null = null;
let compiledAnalysisGraph: Promise<any> | null = null;
let langGraphCheckpointer: Promise<unknown | undefined> | null = null;

function maybeString(value: string | undefined | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function buildChatTopic(threadId: string) {
  return `lead-chat:${threadId}`;
}

function formatLeadResponse(lead: LeadRow) {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    source: lead.source,
    preferredLanguage: lead.preferred_language,
    preferredContactMethod: lead.preferred_contact_method,
    assignedRmId: lead.assigned_rm_id,
    assignedRm: lead.assigned_rm
      ? {
          id: lead.assigned_rm.id,
          name: lead.assigned_rm.name,
          email: lead.assigned_rm.email,
        }
      : null,
    contactStatus: lead.contact_status,
    progressStatus: lead.progress_status,
    callDueAt: lead.call_due_at,
    lastContactedAt: lead.last_contacted_at,
    interestLevelScore: lead.interest_level_score,
    readinessToSignupScore: lead.readiness_to_signup_score,
    networkSizeScore: lead.network_size_score,
    finalInterestScore: lead.final_interest_score,
    reason: lead.reason,
    objections: lead.objections ?? [],
    topicsCovered: lead.topics_covered ?? [],
    recommendedNextAction: lead.recommended_next_action,
    handoffSummary: lead.handoff_summary,
    overallSummary: lead.overall_summary,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  };
}

function formatMessage(message: MessageRow) {
  return {
    id: message.id,
    threadId: message.thread_id,
    senderType: message.sender_type,
    senderId: message.sender_id,
    receiverType: message.receiver_type,
    receiverId: message.receiver_id,
    messageText: message.message_text,
    metadata: message.metadata ?? {},
    sentAt: message.sent_at,
  };
}

function formatCallThread(callThread: CallThreadRow | null) {
  if (!callThread) return null;
  return {
    id: callThread.id,
    leadId: callThread.lead_id,
    rmId: callThread.rm_id,
    vapiCallId: callThread.vapi_call_id,
    triggerSource: callThread.trigger_source,
    status: callThread.status,
    requestedAt: callThread.requested_at,
    callDueAt: callThread.call_due_at,
    startedAt: callThread.started_at,
    endedAt: callThread.ended_at,
    durationSeconds: callThread.duration_seconds,
    transcript: callThread.transcript,
    providerPayload: callThread.provider_payload ?? {},
    attemptCount: callThread.attempt_count,
    lastError: callThread.last_error,
    createdAt: callThread.created_at,
    updatedAt: callThread.updated_at,
  };
}

async function getOptionalCheckpointer() {
  if (!env.langgraphPostgresUrl) {
    return undefined;
  }

  if (!langGraphCheckpointer) {
    langGraphCheckpointer = (async () => {
      const { PostgresSaver } = await import(
        "npm:@langchain/langgraph-checkpoint-postgres"
      );
      const saver = PostgresSaver.fromConnString(env.langgraphPostgresUrl);
      await saver.setup();
      return saver;
    })();
  }

  return await langGraphCheckpointer;
}

async function getQueryGraph() {
  if (!compiledQueryGraph) {
    compiledQueryGraph = (async () => {
      const graph = new StateGraph(queryGraphState)
        .addNode("refineQueries", async (state) => ({
          refinedQueries: await generateRefinedQueries(state.userMessage),
        }))
        .addNode("loadKnowledge", async (state) => ({
          knowledgeSnippets: await retrieveKnowledgeSnippets([
            state.userMessage,
            ...state.refinedQueries,
          ]),
        }))
        .addNode("loadMemories", async (state) => ({
          memorySnippets: [],
        }))
        .addEdge(START, "refineQueries")
        .addEdge("refineQueries", "loadKnowledge")
        .addEdge("loadKnowledge", "loadMemories")
        .addEdge("loadMemories", END);

      const checkpointer = await getOptionalCheckpointer();
      return graph.compile(checkpointer ? { checkpointer } : undefined);
    })();
  }

  return compiledQueryGraph;
}

async function getAnalysisGraph() {
  if (!compiledAnalysisGraph) {
    compiledAnalysisGraph = (async () => {
      const graph = new StateGraph(analysisGraphState)
        .addNode("normalizeTranscript", async (state) => ({
          normalizedTranscript: state.transcript
            .replace(/\n{2,}/g, "\n")
            .trim(),
        }))
        .addEdge(START, "normalizeTranscript")
        .addEdge("normalizeTranscript", END);

      const checkpointer = await getOptionalCheckpointer();
      return graph.compile(checkpointer ? { checkpointer } : undefined);
    })();
  }

  return compiledAnalysisGraph;
}

async function generateRefinedQueries(userMessage: string) {
  try {
    const result = await generateObject({
      model: google(env.geminiModel),
      schema: z.object({
        queries: z.array(z.string().min(1)).length(2),
      }),
      prompt: `Rewrite the user query into two short retrieval-friendly variants for partner lead conversion context.\n\nUser query: ${userMessage}`,
    });

    return result.object.queries;
  } catch (_error) {
    return [userMessage, userMessage];
  }
}

async function retrieveKnowledgeSnippets(queries: string[]) {
  const serviceClient = getServiceClient();

  try {
    const snippets = await Promise.all(
      queries.map(async (query) => {
        const embedding = await embed({
          model: google.textEmbeddingModel(env.geminiEmbeddingModel),
          value: query,
        });

        const { data, error } = await serviceClient.rpc("match_knowledge_chunks", {
          query_embedding: embedding.embedding,
          match_count: 4,
        });

        if (error || !data?.length) {
          return [];
        }

        return data.map((row: { content: string }) => row.content);
      }),
    );

    const merged = [...new Set(snippets.flat().filter(Boolean))];
    if (merged.length) {
      return merged.slice(0, 8);
    }
  } catch (_error) {
    // Fall back to static knowledge below.
  }

  return fallbackKnowledgeDocuments.map((doc) => `${doc.title}: ${doc.content}`);
}

async function searchLeadMemories(leadId: string, query: string) {
  if (!env.mem0ApiKey) {
    return [];
  }

  try {
    const response = await fetch(`${env.mem0BaseUrl}/v1/memories/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${env.mem0ApiKey}`,
      },
      body: JSON.stringify({
        query,
        version: "v2",
        filters: {
          user_id: leadId,
        },
        top_k: 5,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const entries = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload?.memories)
          ? payload.memories
          : [];

    return entries
      .map((entry: Record<string, unknown>) =>
        String(entry.memory ?? entry.text ?? entry.content ?? ""),
      )
      .filter(Boolean);
  } catch (_error) {
    return [];
  }
}

async function storeLeadMemory(leadId: string, content: string, metadata: Record<string, unknown>) {
  if (!env.mem0ApiKey || !content.trim()) {
    return;
  }

  try {
    await fetch(`${env.mem0BaseUrl}/v1/memories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${env.mem0ApiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content,
          },
        ],
        user_id: leadId,
        metadata,
      }),
    });
  } catch (_error) {
    // Memory persistence is best-effort for MVP.
  }
}

function buildSystemPrompt({
  lead,
  knowledgeSnippets,
  memorySnippets,
}: {
  lead: LeadRow;
  knowledgeSnippets: string[];
  memorySnippets: string[];
}) {
  const language = lead.preferred_language ?? "English";

  return `
You are Rupeezy's AI partner lead conversion assistant.

Goal:
- qualify the lead for the Rupeezy AP partner program
- speak in ${language}
- keep responses short, natural, and useful
- handle objections conversationally
- move toward a clear next step

Core approved knowledge:
${knowledgeSnippets.map((snippet) => `- ${snippet}`).join("\n")}

Prior lead memory:
${memorySnippets.length ? memorySnippets.map((snippet) => `- ${snippet}`).join("\n") : "- none"}

Rules:
- never invent claims beyond the approved knowledge
- do not give investment advice
- do not ask for passwords, OTPs, or sensitive credentials
- ask one question at a time
- adapt to Hindi, English, or Hinglish if the user switches
- explain zero joining fee, 100 percent brokerage share, daily payouts, onboarding help, and support when relevant
- handle these objections naturally: already with another broker, not enough contacts, client support, trust, call later
`;
}

function formatConversationTranscript(messages: MessageRow[]) {
  return messages
    .map((message) => `${message.sender_type.toUpperCase()}: ${message.message_text}`)
    .join("\n");
}

async function generateChatReply({
  lead,
  messages,
  queryContext,
  threadId,
}: {
  lead: LeadRow;
  messages: MessageRow[];
  queryContext: {
    knowledgeSnippets: string[];
    memorySnippets: string[];
  };
  threadId: string;
}) {
  const serviceClient = getServiceClient();
  const transcript = formatConversationTranscript(messages);

  const { data: placeholderMessage, error: placeholderError } = await serviceClient
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_type: "ai",
      sender_id: "rupeezy-ai",
      receiver_type: "lead",
      receiver_id: lead.id,
      message_text: "",
      metadata: {
        streaming: true,
      },
    })
    .select("*")
    .single();

  if (placeholderError || !placeholderMessage) {
    throw new Error(placeholderError?.message ?? "Unable to create assistant message.");
  }

  let accumulated = "";
  let chunkCounter = 0;

  const response = streamText({
    model: google(env.geminiModel),
    system: buildSystemPrompt({
      lead,
      knowledgeSnippets: queryContext.knowledgeSnippets,
      memorySnippets: queryContext.memorySnippets,
    }),
    prompt: `Lead profile:\nName: ${lead.name}\nPhone: ${lead.phone}\nPreferred language: ${lead.preferred_language ?? "unknown"}\n\nConversation so far:\n${transcript}\n\nRespond to the latest user message naturally and keep it concise.`,
  });

  for await (const chunk of response.textStream) {
    accumulated += chunk;
    chunkCounter += 1;

    if (chunkCounter % 3 === 0) {
      await serviceClient
        .from("messages")
        .update({
          message_text: accumulated,
          metadata: {
            streaming: true,
          },
        })
        .eq("id", placeholderMessage.id);
    }
  }

  const finalText = accumulated.trim();

  await serviceClient
    .from("messages")
    .update({
      message_text: finalText || "I understand. Let me help you with the next step.",
      metadata: {
        streaming: false,
      },
    })
    .eq("id", placeholderMessage.id);

  return {
    id: placeholderMessage.id,
    text: finalText || "I understand. Let me help you with the next step.",
  };
}

async function analyzeTranscript({
  lead,
  transcript,
}: {
  lead: LeadRow;
  transcript: string;
}) {
  const analysisGraph = await getAnalysisGraph();
  const normalized = await analysisGraph.invoke(
    { transcript },
    {
      configurable: {
        thread_id: `${lead.id}:${crypto.randomUUID()}`,
      },
    },
  );
  const result = await generateObject({
    model: google(env.geminiModel),
    schema: analysisSchema,
    prompt: `You are evaluating a lead conversion conversation for Rupeezy's AP partner program.

Lead details:
- Name: ${lead.name}
- Preferred language: ${lead.preferred_language ?? "unknown"}
- Preferred contact method: ${lead.preferred_contact_method}

Transcript:
${normalized.normalizedTranscript}

Return:
- whether the conversation is complete
- whether an AI follow-up call should be scheduled
- interest level score
- readiness to signup score
- network size score
- final interest score hot/warm/cold
- reason
- objections
- topics covered
- recommended next action
- handoff summary
- overall summary

Use interest level, readiness to sign up, and network size to determine the final lead classification.`,
  });

  return result.object;
}

async function pickAssignedRmId(existingRmId?: string | null) {
  if (existingRmId) {
    return existingRmId;
  }

  const serviceClient = getServiceClient();
  const { data } = await serviceClient
    .from("users")
    .select("id")
    .eq("user_role", "rm")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

async function applyLeadAnalysis({
  lead,
  analysis,
  transcript,
}: {
  lead: LeadRow;
  analysis: z.infer<typeof analysisSchema>;
  transcript: string;
}) {
  const serviceClient = getServiceClient();

  const assignedRmId =
    analysis.finalInterestScore === "hot"
      ? await pickAssignedRmId(lead.assigned_rm_id)
      : lead.assigned_rm_id;

  const progressStatus =
    analysis.finalInterestScore === "hot" && assignedRmId
      ? "assigned"
      : "pending_assignment";

  const updatePayload = {
    assigned_rm_id: assignedRmId,
    contact_status: "contacted_by_ai",
    progress_status: progressStatus,
    interest_level_score: analysis.interestLevelScore,
    readiness_to_signup_score: analysis.readinessToSignupScore,
    network_size_score: analysis.networkSizeScore,
    final_interest_score: analysis.finalInterestScore,
    reason: analysis.reason,
    objections: analysis.objections,
    topics_covered: analysis.topicsCovered,
    recommended_next_action: analysis.recommendedNextAction,
    handoff_summary: analysis.handoffSummary,
    overall_summary: analysis.overallSummary,
    last_contacted_at: new Date().toISOString(),
  };

  const { data: updatedLead, error } = await serviceClient
    .from("leads")
    .update(updatePayload)
    .eq("id", lead.id)
    .select(
      `
        *,
        assigned_rm:users!leads_assigned_rm_id_fkey (
          id,
          name,
          email
        )
      `,
    )
    .single();

  if (error || !updatedLead) {
    throw new Error(error?.message ?? "Unable to update lead analysis.");
  }

  await storeLeadMemory(
    lead.id,
    `Lead summary: ${analysis.overallSummary}\nReason: ${analysis.reason}\nRecommended next action: ${analysis.recommendedNextAction}\nTranscript:\n${transcript}`,
    {
      leadId: lead.id,
      finalInterestScore: analysis.finalInterestScore,
      objections: analysis.objections,
      topicsCovered: analysis.topicsCovered,
    },
  );

  if (analysis.shouldScheduleFollowUpCall) {
    await ensureScheduledCall({
      leadId: lead.id,
      rmId: assignedRmId,
      triggerSource: "chat_followup",
      dueAt: new Date().toISOString(),
    });
  }

  return updatedLead as LeadRow;
}

async function buildConversationContext(
  leadId: string,
  graphThreadId: string,
  userMessage: string,
) {
  const queryGraph = await getQueryGraph();
  const queryState = await queryGraph.invoke(
    { userMessage },
    { configurable: { thread_id: graphThreadId } },
  );
  const memorySnippets = await searchLeadMemories(leadId, userMessage);

  return {
    knowledgeSnippets: queryState.knowledgeSnippets,
    memorySnippets,
  };
}

async function getLeadById(leadId: string) {
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from("leads")
    .select(
      `
        *,
        assigned_rm:users!leads_assigned_rm_id_fkey (
          id,
          name,
          email
        )
      `,
    )
    .eq("id", leadId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Lead not found.");
  }

  return data as LeadRow;
}

async function getChatThreadById(threadId: string) {
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from("chat_threads")
    .select("*")
    .eq("id", threadId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Chat thread not found.");
  }

  return data as ChatThreadRow;
}

async function getMessagesForThread(threadId: string) {
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("sent_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MessageRow[];
}

async function ensurePublicLeadAccess(auth: AuthContext, lead: LeadRow) {
  if (lead.public_auth_user_id !== auth.user.id && auth.userRole !== "admin") {
    throw new Error("Forbidden");
  }
}

async function ensureLeadAccess(auth: AuthContext, leadId: string) {
  const lead = await getLeadById(leadId);

  if (auth.userRole === "admin") {
    return lead;
  }

  if (auth.userRole === "rm" && lead.assigned_rm_id === auth.user.id) {
    return lead;
  }

  if (!auth.userRole && lead.public_auth_user_id === auth.user.id) {
    return lead;
  }

  throw new Error("Forbidden");
}

export async function createPublicLead(publicAuthUserId: string, payload: PublicLeadInput) {
  const serviceClient = getServiceClient();
  const insertPayload = {
    public_auth_user_id: publicAuthUserId,
    name: payload.name,
    phone: payload.phone,
    email: maybeString(payload.email),
    address: maybeString(payload.address) ?? maybeString(payload.city),
    source: "client_website",
    preferred_language: maybeString(payload.preferredLanguage),
    preferred_contact_method: payload.preferredContactMethod,
    contact_status: "pending",
    progress_status: "pending_contact",
    call_due_at:
      payload.preferredContactMethod === "call_under_5_min"
        ? new Date().toISOString()
        : null,
  };

  const { data: lead, error } = await serviceClient
    .from("leads")
    .insert(insertPayload)
    .select(
      `
        *,
        assigned_rm:users!leads_assigned_rm_id_fkey (
          id,
          name,
          email
        )
      `,
    )
    .single();

  if (error || !lead) {
    throw new Error(error?.message ?? "Unable to create lead.");
  }

  let chatThread: ChatThreadRow | null = null;
  let callThread: CallThreadRow | null = null;
  let assistantMessage: MessageRow | null = null;

  if (payload.preferredContactMethod === "chat_now") {
    chatThread = await createChatThread(lead.id, publicAuthUserId);
    assistantMessage = await insertAssistantGreeting(chatThread.id, lead as LeadRow);
  } else {
    callThread = await createCallThread({
      leadId: lead.id,
      rmId: null,
      triggerSource: "client_website",
      dueAt: new Date().toISOString(),
    });
    queueDispatcherKickoff(callThread.id);
  }

  return {
    lead: formatLeadResponse(lead as LeadRow),
    chatThread: chatThread
      ? {
          id: chatThread.id,
          channelTopic: chatThread.channel_topic,
          status: chatThread.status,
        }
      : null,
    callThread: formatCallThread(callThread),
    assistantMessage: assistantMessage ? formatMessage(assistantMessage) : null,
  };
}

export async function createManualLead(auth: AuthContext, payload: ManualLeadInput) {
  const serviceClient = getServiceClient();
  const assignedRmId =
    auth.userRole === "rm"
      ? auth.user.id
      : payload.assignedRmId ?? null;

  const source = auth.userRole === "rm" ? "rm_manual" : "admin_manual";

  const { data: lead, error } = await serviceClient
    .from("leads")
    .insert({
      public_auth_user_id: null,
      name: payload.name,
      phone: payload.phone,
      email: maybeString(payload.email),
      address: maybeString(payload.address) ?? maybeString(payload.city),
      source,
      preferred_language: maybeString(payload.preferredLanguage),
      preferred_contact_method: payload.preferredContactMethod,
      assigned_rm_id: assignedRmId,
      contact_status: "pending",
      progress_status: "pending_contact",
      call_due_at:
        payload.preferredContactMethod === "call_under_5_min"
          ? new Date().toISOString()
          : null,
    })
    .select(
      `
        *,
        assigned_rm:users!leads_assigned_rm_id_fkey (
          id,
          name,
          email
        )
      `,
    )
    .single();

  if (error || !lead) {
    throw new Error(error?.message ?? "Unable to create lead.");
  }

  let chatThread: ChatThreadRow | null = null;
  let callThread: CallThreadRow | null = null;
  let assistantMessage: MessageRow | null = null;

  if (payload.preferredContactMethod === "chat_now") {
    chatThread = await createChatThread(lead.id, null);
    assistantMessage = await insertAssistantGreeting(chatThread.id, lead as LeadRow);
  } else {
    callThread = await createCallThread({
      leadId: lead.id,
      rmId: assignedRmId,
      triggerSource: source,
      dueAt: new Date().toISOString(),
    });
    queueDispatcherKickoff(callThread.id);
  }

  return {
    lead: formatLeadResponse(lead as LeadRow),
    chatThread: chatThread
      ? {
          id: chatThread.id,
          channelTopic: chatThread.channel_topic,
          status: chatThread.status,
        }
      : null,
    callThread: formatCallThread(callThread),
    assistantMessage: assistantMessage ? formatMessage(assistantMessage) : null,
  };
}

async function createChatThread(leadId: string, publicAuthUserId: string | null) {
  const serviceClient = getServiceClient();
  const topic = buildChatTopic(crypto.randomUUID());
  const { data, error } = await serviceClient
    .from("chat_threads")
    .insert({
      lead_id: leadId,
      public_auth_user_id: publicAuthUserId,
      channel_topic: topic,
      status: "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create chat thread.");
  }

  return data as ChatThreadRow;
}

async function ensureActiveChatThreadForLead(
  lead: LeadRow,
  publicAuthUserId: string | null,
) {
  const serviceClient = getServiceClient();
  const { data: existingThread } = await serviceClient
    .from("chat_threads")
    .select("*")
    .eq("lead_id", lead.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingThread) {
    const messages = await getMessagesForThread(existingThread.id);
    const assistantMessage =
      messages.find((message) => message.sender_type === "ai") ??
      (messages.length === 0
        ? await insertAssistantGreeting(existingThread.id, lead)
        : null);

    return {
      chatThread: existingThread as ChatThreadRow,
      assistantMessage,
    };
  }

  const chatThread = await createChatThread(lead.id, publicAuthUserId);
  const assistantMessage = await insertAssistantGreeting(chatThread.id, lead);

  return {
    chatThread,
    assistantMessage,
  };
}

export async function startPublicLeadChat(auth: AuthContext, leadId: string) {
  const lead = await ensureLeadAccess(auth, leadId);
  await ensurePublicLeadAccess(auth, lead);

  const { chatThread, assistantMessage } = await ensureActiveChatThreadForLead(
    lead,
    auth.user.id,
  );

  return {
    lead: formatLeadResponse(lead),
    chatThread: {
      id: chatThread.id,
      channelTopic: chatThread.channel_topic,
      status: chatThread.status,
    },
    assistantMessage: assistantMessage ? formatMessage(assistantMessage) : null,
  };
}

async function insertAssistantGreeting(threadId: string, lead: LeadRow) {
  const serviceClient = getServiceClient();
  const firstName = lead.name.split(" ")[0] ?? lead.name;
  const language = (lead.preferred_language ?? "").toLowerCase();
  const greeting =
    language.includes("hindi") || language.includes("hinglish")
      ? `Hi ${firstName}, main Rupeezy ke partner program ke baare mein aapko short mein guide kar sakta hoon. Kya aap apne current partner setup ke baare mein batana chahenge?`
      : `Hi ${firstName}, I can quickly walk you through Rupeezy's partner program and see if it fits you. Can you tell me a bit about your current setup?`;

  const { data, error } = await serviceClient
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_type: "ai",
      sender_id: "rupeezy-ai",
      receiver_type: "lead",
      receiver_id: lead.id,
      message_text: greeting,
      metadata: {
        greeting: true,
      },
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create greeting.");
  }

  await serviceClient
    .from("leads")
    .update({
      contact_status: "contacted_by_ai",
      last_contacted_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  return data as MessageRow;
}

async function createCallThread({
  leadId,
  rmId,
  triggerSource,
  dueAt,
}: {
  leadId: string;
  rmId: string | null;
  triggerSource: "client_website" | "admin_manual" | "rm_manual" | "chat_followup" | "call_followup";
  dueAt: string;
}) {
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from("call_threads")
    .insert({
      lead_id: leadId,
      rm_id: rmId,
      trigger_source: triggerSource,
      status: "queued",
      requested_at: new Date().toISOString(),
      call_due_at: dueAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create call thread.");
  }

  await serviceClient
    .from("leads")
    .update({
      call_due_at: dueAt,
    })
    .eq("id", leadId);

  return data as CallThreadRow;
}

async function ensureScheduledCall({
  leadId,
  rmId,
  triggerSource,
  dueAt,
}: {
  leadId: string;
  rmId: string | null;
  triggerSource: "chat_followup" | "call_followup" | "admin_manual" | "rm_manual";
  dueAt: string;
}) {
  const serviceClient = getServiceClient();
  const { data: existing } = await serviceClient
    .from("call_threads")
    .select("*")
    .eq("lead_id", leadId)
    .in("status", ["queued", "claiming", "initiated", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const callThread = await createCallThread({
    leadId,
    rmId,
    triggerSource,
    dueAt,
  });

  queueDispatcherKickoff(callThread.id);
  return callThread;
}

function queueDispatcherKickoff(callThreadId: string) {
  fetch(`${env.functionsBaseUrl}/call-dispatcher`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ callThreadId }),
  }).catch(() => {
    // cron-backed dispatcher is the reliability path
  });
}

export async function listLeads(auth: AuthContext) {
  const serviceClient = getServiceClient();
  let query = serviceClient
    .from("leads")
    .select(
      `
        *,
        assigned_rm:users!leads_assigned_rm_id_fkey (
          id,
          name,
          email
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (auth.userRole === "rm") {
    query = query.eq("assigned_rm_id", auth.user.id);
  } else if (!auth.userRole) {
    query = query.eq("public_auth_user_id", auth.user.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((lead) => formatLeadResponse(lead as LeadRow));
}

export async function getLeadDetail(auth: AuthContext, leadId: string) {
  const lead = await ensureLeadAccess(auth, leadId);
  const serviceClient = getServiceClient();
  const { data: chatThread } = await serviceClient
    .from("chat_threads")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const messages = chatThread
    ? await getMessagesForThread(chatThread.id)
    : [];

  const { data: callThread } = await serviceClient
    .from("call_threads")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    lead: formatLeadResponse(lead),
    latestChatThread: chatThread
      ? {
          id: chatThread.id,
          channelTopic: chatThread.channel_topic,
          status: chatThread.status,
          startedAt: chatThread.started_at,
          endedAt: chatThread.ended_at,
        }
      : null,
    messages: messages.map(formatMessage),
    latestCallThread: formatCallThread(callThread as CallThreadRow | null),
  };
}

export async function getThreadMessages(auth: AuthContext, threadId: string) {
  const thread = await getChatThreadById(threadId);
  const lead = await ensureLeadAccess(auth, thread.lead_id);
  if (!lead) {
    throw new Error("Forbidden");
  }

  const messages = await getMessagesForThread(threadId);
  return {
    thread: {
      id: thread.id,
      leadId: thread.lead_id,
      channelTopic: thread.channel_topic,
      status: thread.status,
      startedAt: thread.started_at,
      endedAt: thread.ended_at,
    },
    messages: messages.map(formatMessage),
  };
}

export async function sendPublicChatMessage(auth: AuthContext, threadId: string, payload: ChatMessageInput) {
  const thread = await getChatThreadById(threadId);
  const lead = await ensureLeadAccess(auth, thread.lead_id);
  await ensurePublicLeadAccess(auth, lead);

  const serviceClient = getServiceClient();
  const { data: userMessage, error } = await serviceClient
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_type: "lead",
      sender_id: lead.id,
      receiver_type: "ai",
      receiver_id: "rupeezy-ai",
      message_text: payload.messageText.trim(),
      metadata: {},
    })
    .select("*")
    .single();

  if (error || !userMessage) {
    throw new Error(error?.message ?? "Unable to save message.");
  }

  const history = await getMessagesForThread(threadId);
  const queryContext = await buildConversationContext(
    lead.id,
    threadId,
    payload.messageText,
  );
  const assistant = await generateChatReply({
    lead,
    messages: history,
    queryContext,
    threadId,
  });

  const finalHistory = await getMessagesForThread(threadId);
  const transcript = formatConversationTranscript(finalHistory);
  const analysis = await analyzeTranscript({
    lead,
    transcript,
  });
  const updatedLead = await applyLeadAnalysis({
    lead,
    analysis,
    transcript,
  });

  if (analysis.conversationComplete) {
    await serviceClient
      .from("chat_threads")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", threadId);
  }

  return {
    userMessage: formatMessage(userMessage as MessageRow),
    assistantMessage: {
      id: assistant.id,
      messageText: assistant.text,
    },
    lead: formatLeadResponse(updatedLead as LeadRow),
    conversationComplete: analysis.conversationComplete,
  };
}

export async function endPublicChat(auth: AuthContext, threadId: string) {
  const thread = await getChatThreadById(threadId);
  const lead = await ensureLeadAccess(auth, thread.lead_id);
  await ensurePublicLeadAccess(auth, lead);
  const serviceClient = getServiceClient();
  const messages = await getMessagesForThread(threadId);
  const transcript = formatConversationTranscript(messages);
  const analysis = await analyzeTranscript({
    lead,
    transcript,
  });

  const updatedLead = await applyLeadAnalysis({
    lead,
    analysis,
    transcript,
  });

  await serviceClient
    .from("chat_threads")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
    })
    .eq("id", threadId);

  return {
    lead: formatLeadResponse(updatedLead as LeadRow),
    conversationComplete: true,
  };
}

export async function scheduleLeadCall(auth: AuthContext, leadId: string, payload: ScheduleCallInput) {
  const lead = await ensureLeadAccess(auth, leadId);
  const dueAt = payload.dueAt ?? new Date().toISOString();
  const rmId = auth.userRole === "rm" ? auth.user.id : lead.assigned_rm_id;
  const source =
    payload.triggerSource ??
    (auth.userRole === "rm" ? "rm_manual" : "admin_manual");
  const callThread = await ensureScheduledCall({
    leadId,
    rmId,
    triggerSource: source,
    dueAt,
  });

  return formatCallThread(callThread as CallThreadRow);
}

export async function assignLeadToRm(auth: AuthContext, leadId: string, payload: AssignRmInput) {
  if (auth.userRole !== "admin") {
    throw new Error("Forbidden");
  }

  await ensureLeadAccess(auth, leadId);
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from("leads")
    .update({
      assigned_rm_id: payload.assignedRmId,
      progress_status: "assigned",
    })
    .eq("id", leadId)
    .select(
      `
        *,
        assigned_rm:users!leads_assigned_rm_id_fkey (
          id,
          name,
          email
        )
      `,
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to assign RM.");
  }

  return formatLeadResponse(data as LeadRow);
}

type DispatcherInput = {
  callThreadId?: string;
  limit?: number;
};

async function createOutboundCall(callThread: CallThreadRow, lead: LeadRow) {
  if (!env.vapiApiKey || !env.vapiAssistantId || !env.vapiPhoneNumberId) {
    throw new Error("Vapi environment variables are not fully configured.");
  }

  const response = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.vapiApiKey}`,
    },
    body: JSON.stringify({
      assistantId: env.vapiAssistantId,
      phoneNumberId: env.vapiPhoneNumberId,
      assistantOverrides: {
        variableValues: {
          leadId: lead.id,
          callThreadId: callThread.id,
          leadName: lead.name,
          preferredLanguage: lead.preferred_language ?? "english",
        },
      },
      customer: {
        number: lead.phone,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload?.message ??
        payload?.error?.message ??
        "Unable to create outbound call.",
    );
  }

  return payload as Record<string, unknown>;
}

async function markCallThreadQueuedAfterFailure(callThreadId: string, attemptCount: number, message: string) {
  const serviceClient = getServiceClient();
  const nextDueAt = new Date(Date.now() + 60_000 * Math.min(attemptCount, 5)).toISOString();
  const nextStatus = attemptCount >= 5 ? "failed" : "queued";

  await serviceClient
    .from("call_threads")
    .update({
      status: nextStatus,
      attempt_count: attemptCount,
      last_error: message,
      call_due_at: nextDueAt,
    })
    .eq("id", callThreadId);
}

export async function dispatchQueuedCalls(input: DispatcherInput = {}) {
  const serviceClient = getServiceClient();

  let callThreads: CallThreadRow[] = [];

  if (input.callThreadId) {
    const { data, error } = await serviceClient
      .from("call_threads")
      .select("*")
      .eq("id", input.callThreadId)
      .in("status", ["queued", "claiming", "failed"])
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      callThreads = [data as CallThreadRow];
      await serviceClient
        .from("call_threads")
        .update({ status: "claiming" })
        .eq("id", data.id);
    }
  } else {
    const { data, error } = await serviceClient.rpc("claim_due_call_threads", {
      limit_count: input.limit ?? 5,
    });

    if (error) {
      throw new Error(error.message);
    }

    callThreads = (data ?? []) as CallThreadRow[];
  }

  const results = [];

  for (const callThread of callThreads) {
    const lead = await getLeadById(callThread.lead_id);

    try {
      const payload = await createOutboundCall(callThread, lead);
      const vapiCallId = String(
        payload.id ?? payload.call?.id ?? payload.callId ?? "",
      );

      await serviceClient
        .from("call_threads")
        .update({
          status: vapiCallId ? "initiated" : "failed",
          vapi_call_id: vapiCallId || null,
          provider_payload: payload,
          attempt_count: callThread.attempt_count + 1,
          last_error: null,
          started_at: new Date().toISOString(),
        })
        .eq("id", callThread.id);

      await serviceClient
        .from("leads")
        .update({
          contact_status: "contacted_by_ai",
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", callThread.lead_id);

      results.push({
        callThreadId: callThread.id,
        status: "initiated",
        vapiCallId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Outbound call failed.";
      const attemptCount = callThread.attempt_count + 1;
      await markCallThreadQueuedAfterFailure(callThread.id, attemptCount, message);
      results.push({
        callThreadId: callThread.id,
        status: "failed",
        error: message,
      });
    }
  }

  return results;
}

function extractTranscriptFromVapiPayload(payload: Record<string, unknown>) {
  const message =
    (payload.message as Record<string, unknown> | undefined) ?? payload;
  const call =
    (message.call as Record<string, unknown> | undefined) ??
    (payload.call as Record<string, unknown> | undefined) ??
    payload;
  const artifact =
    (message.artifact as Record<string, unknown> | undefined) ??
    (call.artifact as Record<string, unknown> | undefined);
  const transcript =
    message.transcript ??
    call.transcript ??
    artifact?.transcript;

  if (typeof transcript === "string") {
    return transcript;
  }

  if (Array.isArray(transcript)) {
    return transcript
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const speaker = String((entry as Record<string, unknown>).speaker ?? "speaker");
          const text = String((entry as Record<string, unknown>).text ?? "");
          return `${speaker.toUpperCase()}: ${text}`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function getWebhookCallThreadFallbackId(payload: Record<string, unknown>) {
  const message =
    (payload.message as Record<string, unknown> | undefined) ?? payload;
  const call =
    (message.call as Record<string, unknown> | undefined) ??
    (payload.call as Record<string, unknown> | undefined) ??
    payload;
  const artifact =
    (message.artifact as Record<string, unknown> | undefined) ??
    (call.artifact as Record<string, unknown> | undefined);
  const variableValues =
    (artifact?.variableValues as Record<string, unknown> | undefined) ??
    (call.variableValues as Record<string, unknown> | undefined);
  const fallbackId = variableValues?.callThreadId;

  return typeof fallbackId === "string" && fallbackId.length > 0
    ? fallbackId
    : "";
}

export async function processVapiWebhookPayload(payload: Record<string, unknown>) {
  const message =
    (payload.message as Record<string, unknown> | undefined) ?? payload;
  const eventType = typeof message.type === "string" ? message.type : "";
  const status = typeof message.status === "string" ? message.status : "";
  const call =
    (message.call as Record<string, unknown> | undefined) ??
    (payload.call as Record<string, unknown> | undefined) ??
    payload;
  const callId = String(call?.id ?? payload.callId ?? "");

  if (!callId) {
    throw new Error("Missing call id in Vapi payload.");
  }

  const serviceClient = getServiceClient();
  let { data: callThread, error } = await serviceClient
    .from("call_threads")
    .select("*")
    .eq("vapi_call_id", callId)
    .single();

  if ((!callThread || error) && getWebhookCallThreadFallbackId(payload)) {
    const fallbackId = getWebhookCallThreadFallbackId(payload);
    const fallbackLookup = await serviceClient
      .from("call_threads")
      .select("*")
      .eq("id", fallbackId)
      .single();

    callThread = fallbackLookup.data as CallThreadRow | null;
    error = fallbackLookup.error;
  }

  if (error || !callThread) {
    throw new Error(error?.message ?? "Call thread not found for webhook.");
  }

  if (eventType === "status-update" && status && status !== "ended") {
    const nextStatus =
      status === "queued"
        ? "queued"
        : status === "ringing"
          ? "initiated"
          : status === "in-progress"
            ? "in_progress"
            : null;

    if (nextStatus) {
      await serviceClient
        .from("call_threads")
        .update({
          status: nextStatus,
          provider_payload: payload,
        })
        .eq("id", callThread.id);
    }

    return {
      callThread: formatCallThread({
        ...(callThread as CallThreadRow),
        status: nextStatus ?? callThread.status,
        provider_payload: payload,
      }),
      ignored: false,
      eventType,
    };
  }

  const transcript = extractTranscriptFromVapiPayload(payload);

  if (eventType && eventType !== "end-of-call-report" && !transcript.trim()) {
    await serviceClient
      .from("call_threads")
      .update({
        provider_payload: payload,
      })
      .eq("id", callThread.id);

    return {
      callThread: formatCallThread({
        ...(callThread as CallThreadRow),
        provider_payload: payload,
      }),
      ignored: true,
      eventType,
    };
  }

  const endedAt = new Date().toISOString();
  const startedAt = callThread.started_at ? new Date(callThread.started_at).getTime() : Date.now();
  const durationSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));

  await serviceClient
    .from("call_threads")
    .update({
      status: "completed",
      transcript,
      provider_payload: payload,
      ended_at: endedAt,
      duration_seconds: durationSeconds,
    })
    .eq("id", callThread.id);

  const lead = await getLeadById(callThread.lead_id);
  const analysis = await analyzeTranscript({
    lead,
    transcript,
  });
  const updatedLead = await applyLeadAnalysis({
    lead,
    analysis,
    transcript,
  });

  return {
    callThread: formatCallThread({
      ...(callThread as CallThreadRow),
      transcript,
      status: "completed",
      provider_payload: payload,
      ended_at: endedAt,
      duration_seconds: durationSeconds,
    }),
    lead: formatLeadResponse(updatedLead as LeadRow),
  };
}
