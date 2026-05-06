export type UserRole = "admin" | "rm";
export type LeadStatus = "new" | "pending_contact" | "conversation_completed" | "assigned_to_rm" | "follow_up_scheduled" | "converted" | "closed";
export type LeadClassification = "hot" | "warm" | "cold";
export type ConversationChannel = "chat" | "voice";
export type RMTaskStatus = "pending" | "in_progress" | "converted" | "closed";
export type FollowUpStatus = "ready" | "opened" | "sent" | "cancelled";
export type ObjectionResolutionStatus = "resolved" | "partially_resolved" | "unresolved";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  role: string;
  networkSize: string;
  preferredLanguage: string;
  preferredChannel: ConversationChannel;
  whatsappConsent: boolean;
  status: LeadStatus;
  classification: LeadClassification;
  latestScore: number;
}