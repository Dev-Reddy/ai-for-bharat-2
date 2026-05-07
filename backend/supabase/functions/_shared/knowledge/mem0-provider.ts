import { z } from "npm:zod@^4.1.12";
import { env } from "../env.ts";
import { getServiceClient } from "../supabase.ts";
import { tracedAsync } from "../tracing.ts";
import type {
  KnowledgeDocumentProviderInput,
  KnowledgeProvider,
  KnowledgeSyncResult,
  KnowledgeSystemContext,
} from "./types.ts";

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

const mem0SearchResultSchema = z.object({
  id: z.string(),
  memory: z.string(),
  score: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  categories: z.array(z.string()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

function isMem0Configured() {
  return Boolean(env.mem0ApiKey.trim());
}

function maybeString(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function buildKnowledgeSections(content: string, chunkSize = 900) {
  const normalized = content.replace(/\r/g, "").trim();
  if (!normalized) return [];
  const sections = normalized
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
  const chunks: string[] = [];

  for (const section of sections) {
    if (section.length <= chunkSize) {
      chunks.push(section);
      continue;
    }

    for (let index = 0; index < section.length; index += chunkSize) {
      chunks.push(section.slice(index, index + chunkSize));
    }
  }

  return chunks.slice(0, 50);
}

async function mem0Request(path: string, init: RequestInit = {}) {
  if (!isMem0Configured()) {
    throw new Error("Mem0 is not configured.");
  }

  const baseUrl = env.mem0BaseUrl.replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Token ${env.mem0ApiKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const rawBody = await response.text().catch(() => "");
  let payload: unknown = null;
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "message" in payload
      ? String(payload.message)
      : typeof payload === "object" && payload && "error" in payload
      ? String(payload.error)
      : `Mem0 request failed with status ${response.status}`;
    const details = payload
      ? ` | payload=${JSON.stringify(payload)}`
      : rawBody
      ? ` | raw_body=${rawBody}`
      : "";
    const enriched = `Mem0 request failed (${init.method ?? "GET"} ${path}) status=${response.status}: ${message}${details}`;
    throw new Error(enriched);
  }

  return payload;
}

async function getActiveKnowledgeContextImpl(): Promise<KnowledgeSystemContext> {
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from("knowledge_system_contexts")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      id: "env-default",
      name: "Default Knowledge Extraction Context",
      description: "Environment fallback knowledge extraction prompt.",
      promptTemplate: env.mem0KnowledgeInstructions,
      isActive: true,
      createdBy: null,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    promptTemplate: data.prompt_template,
    isActive: data.is_active,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function deleteKnowledgeDocumentImpl(documentId: string) {
  if (!isMem0Configured()) return;

  const params = new URLSearchParams();
  params.set("app_id", env.mem0KnowledgeAppId);
  params.set("agent_id", env.mem0KnowledgeAgentId);
  params.set("metadata", JSON.stringify({ documentId }));
  await mem0Request(`/v1/memories?${params.toString()}`, {
    method: "DELETE",
  });
}

async function searchKnowledgeImpl(query: string) {
  const payload = await mem0Request("/v3/memories/search/", {
    method: "POST",
    body: JSON.stringify({
      query,
      top_k: 8,
      version: "v2",
      filters: {
        AND: [
          { app_id: env.mem0KnowledgeAppId },
          { agent_id: env.mem0KnowledgeAgentId },
        ],
      },
    }),
  });

  const parsed = z.union([
    z.object({
      results: z.array(mem0SearchResultSchema),
    }),
    z.array(mem0SearchResultSchema),
  ]).safeParse(payload);

  if (!parsed.success) {
    return [];
  }

  return Array.isArray(parsed.data) ? parsed.data : parsed.data.results;
}

async function retrieveSnippetsImpl(queries: string[]) {
  try {
    const results = await Promise.all(
      [...new Set(queries.map((query) => query.trim()).filter(Boolean))].slice(0, 4).map(async (query) => {
        const memories = await searchKnowledge(query);
        return memories.map((memory) => {
          const metadata = (memory.metadata ?? {}) as Record<string, unknown>;
          const title = maybeString(typeof metadata.documentTitle === "string" ? metadata.documentTitle : null);
          return title ? `${title}: ${memory.memory}` : memory.memory;
        });
      }),
    );

    const merged = [...new Set(results.flat().filter(Boolean))];
    if (merged.length) {
      return merged.slice(0, 8);
    }
  } catch (_error) {
    // Fall back to static knowledge below.
  }

  return fallbackKnowledgeDocuments.map((doc) => `${doc.title}: ${doc.content}`);
}

async function syncDocumentImpl(document: KnowledgeDocumentProviderInput): Promise<KnowledgeSyncResult> {
  if (!isMem0Configured()) {
    throw new Error("Mem0 is not configured.");
  }

  const context = await getActiveKnowledgeContext();
  await deleteKnowledgeDocument(document.id);

  if (!document.isActive) {
    return {
      syncStatus: "inactive",
      sectionCount: 0,
      eventIds: [],
    };
  }

  const sections = buildKnowledgeSections(document.content);
  const eventIds: string[] = [];

  for (const [index, section] of sections.entries()) {
    const metadata: Record<string, unknown> = {
      documentId: document.id,
      documentTitle: document.title,
      documentType: document.documentType,
      sectionIndex: index,
      sectionCount: sections.length,
      source: "knowledge_document",
    };
    if (document.sourceFileName) {
      metadata.sourceFileName = document.sourceFileName;
    }

    const response = await mem0Request("/v3/memories/add/", {
      method: "POST",
      body: JSON.stringify({
        app_id: env.mem0KnowledgeAppId,
        agent_id: env.mem0KnowledgeAgentId,
        messages: [
          {
            role: "user",
            content: section,
          },
        ],
        metadata,
        infer: true,
        custom_instructions: context.promptTemplate,
      }),
    }) as { event_id?: string } | null;

    if (response?.event_id) {
      eventIds.push(response.event_id);
    }
  }

  return {
    syncStatus: "queued",
    sectionCount: sections.length,
    eventIds,
  };
}

const getActiveKnowledgeContext = tracedAsync(
  "knowledge_context_lookup",
  getActiveKnowledgeContextImpl,
);

const deleteKnowledgeDocument = tracedAsync(
  "mem0_delete_knowledge_document",
  deleteKnowledgeDocumentImpl,
);

const searchKnowledge = tracedAsync(
  "mem0_search_knowledge",
  searchKnowledgeImpl,
);

const retrieveSnippets = tracedAsync(
  "knowledge_retrieve_snippets",
  retrieveSnippetsImpl,
);

const syncDocument = tracedAsync(
  "mem0_sync_knowledge_document",
  syncDocumentImpl,
);

export const mem0KnowledgeProvider: KnowledgeProvider = {
  retrieveSnippets,
  syncDocument,
  deleteDocument: deleteKnowledgeDocument,
  getActiveContext: getActiveKnowledgeContext,
};
