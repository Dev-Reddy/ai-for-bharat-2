import { Store, useStore } from "@tanstack/react-store";
import type { Session } from "@supabase/supabase-js";

export type PortalRole = "admin" | "rm";

export type AuthClaims = {
  user_role?: PortalRole;
  role?: string;
  exp?: number;
  [key: string]: unknown;
};

export type AuthProfile = {
  id: string;
  email: string;
  name: string;
  userRole: PortalRole;
  isActive: boolean;
  avatarPath: string | null;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  claims: AuthClaims | null;
  profile: AuthProfile | null;
  isAuthorized: boolean;
  error: string | null;
};

const initialState: AuthState = {
  status: "loading",
  session: null,
  claims: null,
  profile: null,
  isAuthorized: false,
  error: null,
};

export const authStore = new Store<AuthState>(initialState);

export const authStoreActions = {
  setLoading() {
    authStore.setState((state) => ({ ...state, status: "loading", error: null }));
  },
  setAuthenticated(session: Session, claims: AuthClaims, profile: AuthProfile) {
    authStore.setState(() => ({
      status: "authenticated",
      session,
      claims,
      profile,
      isAuthorized: true,
      error: null,
    }));
  },
  setUnauthorized(message: string) {
    authStore.setState(() => ({
      status: "unauthenticated",
      session: null,
      claims: null,
      profile: null,
      isAuthorized: false,
      error: message,
    }));
  },
  setUnauthenticated(message?: string) {
    authStore.setState(() => ({
      status: "unauthenticated",
      session: null,
      claims: null,
      profile: null,
      isAuthorized: false,
      error: message ?? null,
    }));
  },
};

export function useAuthStore<T>(selector: (state: AuthState) => T) {
  return useStore(authStore, selector);
}
