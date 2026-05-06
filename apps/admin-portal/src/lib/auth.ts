import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { authStoreActions, type AuthClaims, type AuthProfile } from "../store/authStore";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;
const EXPECTED_ROLE = "admin";

let initialized = false;

function decodeJwtClaims(token: string): AuthClaims {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Malformed JWT.");
  }

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(atob(padded)) as AuthClaims;
}

async function fetchCurrentUser(accessToken: string): Promise<AuthProfile> {
  const response = await fetch(`${API_BASE}/auth-me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? "Unable to fetch user profile.");
  }

  return payload.data.user as AuthProfile;
}

async function applySession(session: Session | null) {
  if (!session) {
    authStoreActions.setUnauthenticated();
    return;
  }

  const claims = decodeJwtClaims(session.access_token);

  if (claims.user_role !== EXPECTED_ROLE) {
    await supabase.auth.signOut();
    authStoreActions.setUnauthorized("You are not authorized for the admin portal.");
    return;
  }

  const profile = await fetchCurrentUser(session.access_token);

  if (!profile.isActive) {
    await supabase.auth.signOut();
    authStoreActions.setUnauthorized("Your account is inactive.");
    return;
  }

  authStoreActions.setAuthenticated(session, claims, profile);
}

export async function initializeAuth() {
  authStoreActions.setLoading();

  if (!initialized) {
    supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session).catch((error) => {
        console.error(error);
        authStoreActions.setUnauthenticated("Unable to restore your session.");
      });
    });
    initialized = true;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    authStoreActions.setUnauthenticated(error.message);
    return;
  }

  await applySession(data.session);
}

export async function refreshAuthState() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    authStoreActions.setUnauthenticated(error.message);
    return;
  }

  await applySession(data.session);
}
