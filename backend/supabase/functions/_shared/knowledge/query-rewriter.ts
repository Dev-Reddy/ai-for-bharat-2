import { z } from "npm:zod@^4.1.12";
import { generateObject } from "npm:ai";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google";
import { env } from "../env.ts";
import { tracedAsync } from "../tracing.ts";

let google: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getGoogle() {
  if (!google) {
    google = createGoogleGenerativeAI({
      apiKey: env.geminiApiKey,
    });
  }

  return google;
}

const rewriteKnowledgeQueriesImpl = async (userMessage: string) => {
  try {
    const result = await generateObject({
      model: getGoogle()(env.geminiModel),
      schema: z.object({
        queries: z.array(z.string().min(1)).length(2),
      }),
      prompt: `You rewrite a lead's chat message into retrieval-focused queries for Rupeezy LeadOS.

Context:
- Assistant role: Rupeezy partner lead conversion chat assistant.
- Retrieval source: approved knowledge snippets about AP/MFD partner programs, eligibility, onboarding, objections, support, commercials, payout terms, compliance caution, and RM handoff flows.
- Goal: improve recall for relevant facts without inventing new facts.

Instructions:
- Return exactly 2 queries.
- Keep each query concise and searchable.
- Preserve the lead's intent and key entities (Rupeezy, AP, MFD, RISE, brokerage share, RM, etc.).
- Expand shorthand into retrieval terms when useful (for example "charges" -> joining fee, deposit, exchange fees, formal requirements).
- Include objection/intent framing when relevant (already with broker, not enough contacts, trust, support concern, call later, signup readiness).
- Do not answer the user. Do not add explanations. Do not invent details.

User query:
${userMessage}`,
    });

    return result.object.queries;
  } catch (_error) {
    return [userMessage, userMessage];
  }
};

export const rewriteKnowledgeQueries = tracedAsync(
  "knowledge_query_rewriter",
  rewriteKnowledgeQueriesImpl,
);
