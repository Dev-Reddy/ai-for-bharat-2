function readEnv(name: string) {
  return Deno.env.get(name);
}

export function requireEnv(name: string) {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const env = {
  get supabaseUrl() {
    return requireEnv("PROJECT_SUPABASE_URL");
  },
  get supabaseSecretKey() {
    return requireEnv("PROJECT_SUPABASE_SECRET_KEY");
  },
  get supabasePublishableKey() {
    return requireEnv("PROJECT_SUPABASE_PUBLISHABLE_KEY");
  },
  get functionsBaseUrl() {
    return `${this.supabaseUrl}/functions/v1`;
  },
  get adminBaseUrl() {
    return requireEnv("APP_BASE_URL_ADMIN");
  },
  get rmBaseUrl() {
    return requireEnv("APP_BASE_URL_RM");
  },
  get geminiApiKey() {
    return requireEnv("GEMINI_API_KEY");
  },
  get geminiModel() {
    return readEnv("GEMINI_MODEL") ?? "gemini-2.5-flash";
  },
  get geminiEmbeddingModel() {
    return readEnv("GEMINI_EMBEDDING_MODEL") ?? "gemini-embedding-001";
  },
  get mem0ApiKey() {
    return readEnv("MEM0_API_KEY") ?? "";
  },
  get mem0BaseUrl() {
    return readEnv("MEM0_BASE_URL") ?? "https://api.mem0.ai";
  },
  get mem0KnowledgeAppId() {
    return readEnv("MEM0_KNOWLEDGE_APP_ID") ?? "aifb-knowledge-base";
  },
  get mem0KnowledgeAgentId() {
    return readEnv("MEM0_KNOWLEDGE_AGENT_ID") ?? "rupeezy-shared-knowledge";
  },
  get mem0ProjectId() {
    return readEnv("MEM0_PROJECT_ID") ?? "";
  },
  get mem0KnowledgeInstructions() {
    return readEnv("MEM0_KNOWLEDGE_INSTRUCTIONS") ??
      "Extract stable Rupeezy partner-program knowledge as atomic factual memories. Preserve named entities, benefits, support details, eligibility, onboarding details, and objection-handling facts. Do not invent claims.";
  },
  get vapiApiKey() {
    return readEnv("VAPI_API_KEY") ?? "";
  },
  get vapiAssistantId() {
    return readEnv("VAPI_ASSISTANT_ID") ?? "";
  },
  get vapiPhoneNumberId() {
    return readEnv("VAPI_PHONE_NUMBER_ID") ?? "";
  },
  get vapiCredentialId() {
    return readEnv("VAPI_CREDENTIAL_ID") ?? "";
  },
  get vapiWebhookSecret() {
    return readEnv("VAPI_WEBHOOK_SECRET") ?? "";
  },
};
