import { createClient } from "jsr:@supabase/supabase-js@2";
import { env } from "./env.ts";

let cachedServiceClient: ReturnType<typeof createClient> | null = null;

export function getServiceClient() {
  if (!cachedServiceClient) {
    cachedServiceClient = createClient(
      env.supabaseUrl,
      env.supabaseSecretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return cachedServiceClient;
}

export function createRequestClient(accessToken: string) {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createPublicClient() {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
