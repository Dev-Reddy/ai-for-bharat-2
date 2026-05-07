'use client';

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://nyrvemlpwxqgwuoklkzd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3i3zvjtBlw2wFeU6B9OrGw_JPWXk3PI";
export const API_BASE = `${SUPABASE_URL}/functions/v1/api`;

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 8,
        },
      },
    });
  }

  return supabaseClient;
}
