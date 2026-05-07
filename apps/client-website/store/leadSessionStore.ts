import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LeadData {
  id?: string;
  name: string;
  phone?: string;
  phoneE164?: string;
  countryIso: string;
  countryCode: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  city?: string;
  preferredLanguage?: string;
  preferredContactMethod?: "chat_now" | "call_under_5_min";
}

export interface LeadSession {
  lead: LeadData;
  chatThreadId?: string | null;
  callThreadId?: string | null;
  channelTopic?: string | null;
}

interface LeadSessionState {
  session: LeadSession | null;
  setSession: (session: LeadSession) => void;
  clearLead: () => void;
}

export const useLeadSessionStore = create<LeadSessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearLead: () => set({ session: null }),
    }),
    {
      name: "lead-session-store",
    },
  ),
);
