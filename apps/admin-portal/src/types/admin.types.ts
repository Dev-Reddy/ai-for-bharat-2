export type UserRole = "admin" | "rm";

export type LeadStatus =
  | "new"
  | "pending_contact"
  | "conversation_completed"
  | "assigned_to_rm"
  | "follow_up_scheduled"
  | "converted"
  | "closed";

export type LeadClassification = "hot" | "warm" | "cold";

export type ConversationChannel = "chat" | "voice";

export type FollowUpStatus = "ready" | "opened" | "sent" | "cancelled";

export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  invitePending?: boolean;
  assignedLeadCount?: number;
  pendingTaskCount?: number;
  convertedCount?: number;
  createdAt?: string;
  clientId?: string;
}

export interface ClientData {
  id: string;
  name: string;
  slug: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  role?: string;
  networkSize?: string;
  preferredLanguage?: string;
  preferredChannel?: string;
  whatsappConsent?: boolean;
  status: LeadStatus;
  classification: LeadClassification;
  latestScore: number;
  latestSummary?: string;
  latestNextAction?: string;
  assignedRm?: Partial<User>;
  campaign?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  channel: ConversationChannel;
  language: string;
  status: string;
  durationSeconds: number;
  classification: LeadClassification;
  score: number;
  startedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  source: string;
  isActive: boolean;
  leadCount: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  convertedCount: number;
}

export interface FollowUp {
  id: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    classification: LeadClassification;
  };
  channel: string;
  status: FollowUpStatus;
  message: string;
  waMeLink?: string;
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  type: "Script" | "FAQ" | "Onboarding" | "Objection Guide";
  isActive: boolean;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  leadId: string;
  leadName: string;
  rmId: string;
  rmName: string;
  originalClassification: LeadClassification;
  correctedClassification: LeadClassification;
  originalScore: number;
  correctedScore: number;
  feedbackType: string;
  comment: string;
  createdAt: string;
}
