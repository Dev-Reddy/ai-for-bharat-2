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
      prompt:
        `Rewrite the user query into two retrieval-friendly variants for partner lead conversion context.Enhance user query. \n\nUser query: ${userMessage}`,
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
