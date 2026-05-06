import { Lead, User, ClientData, Conversation, Campaign, FollowUp, KnowledgeDocument, Feedback } from "../types/admin.types";

export const MOCK_CLIENT: ClientData = {
  id: "client_1",
  name: "FinPartner Pro",
  slug: "finpartnerpro",
};

export const MOCK_ADMIN: User = {
  id: "user_1",
  clientId: "client_1",
  name: "Sharad Admin",
  email: "admin@leados.demo",
  role: "admin",
  isActive: true,
  createdAt: "2026-05-02T09:00:00Z",
};

export const MOCK_RMS: User[] = [
  {
    id: "user_2",
    name: "Shivansh Mishra",
    email: "rm@leados.demo",
    role: "rm",
    isActive: true,
    assignedLeadCount: 10,
    pendingTaskCount: 3,
    convertedCount: 5,
    createdAt: "2026-05-02T09:10:00Z",
  },
  {
    id: "user_3",
    name: "Priya Sharma",
    email: "priya@leados.demo",
    role: "rm",
    isActive: true,
    assignedLeadCount: 15,
    pendingTaskCount: 5,
    convertedCount: 8,
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "user_4",
    name: "Inactive RM",
    email: "inactive@leados.demo",
    role: "rm",
    isActive: false,
    assignedLeadCount: 0,
    pendingTaskCount: 0,
    convertedCount: 0,
    createdAt: "2026-04-15T08:00:00Z",
  },
];

export const MOCK_LEADS: Lead[] = [
  {
    id: "lead_1",
    name: "Amit Sharma",
    phone: "9876543210",
    city: "Hyderabad",
    role: "Financial Advisor",
    preferredLanguage: "Hinglish",
    preferredChannel: "chat",
    status: "assigned_to_rm",
    classification: "hot",
    latestScore: 82,
    latestSummary: "Interested in onboarding and asked for WhatsApp details.",
    latestNextAction: "RM should call today before 6 PM.",
    assignedRm: { id: "user_2", name: "Shivansh Mishra" },
    createdAt: "2026-05-02T10:00:00Z",
    updatedAt: "2026-05-02T10:20:00Z",
  },
  {
    id: "lead_2",
    name: "Rohit Verma",
    phone: "9123456780",
    city: "Delhi",
    role: "Broker",
    preferredLanguage: "Hindi",
    preferredChannel: "voice",
    status: "pending_contact",
    classification: "warm",
    latestScore: 55,
    latestSummary: "Requested a callback to discuss commission structure.",
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-10T09:05:00Z",
  },
  {
    id: "lead_3",
    name: "Anjali Gupta",
    phone: "9988776655",
    city: "Mumbai",
    status: "closed",
    classification: "cold",
    latestScore: 20,
    latestSummary: "Not interested right now. Wants to stick with current broker.",
    createdAt: "2026-04-20T11:00:00Z",
    updatedAt: "2026-04-20T11:15:00Z",
  },
  {
    id: "lead_4",
    name: "Vikram Singh",
    phone: "9871234560",
    status: "conversation_completed",
    classification: "hot",
    latestScore: 90,
    latestSummary: "Ready to switch brokers immediately.",
    createdAt: "2026-05-12T14:00:00Z",
    updatedAt: "2026-05-12T14:10:00Z",
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_1",
    leadId: "lead_1",
    leadName: "Amit Sharma",
    channel: "chat",
    language: "Hinglish",
    status: "completed",
    durationSeconds: 420,
    classification: "hot",
    score: 82,
    startedAt: "2026-05-02T10:05:00Z",
  },
  {
    id: "conv_2",
    leadId: "lead_4",
    leadName: "Vikram Singh",
    channel: "voice",
    language: "Hindi",
    status: "completed",
    durationSeconds: 180,
    classification: "hot",
    score: 90,
    startedAt: "2026-05-12T14:05:00Z",
  },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp_1",
    name: "Demo Partner Campaign",
    source: "website",
    isActive: true,
    leadCount: 50,
    hotCount: 10,
    warmCount: 16,
    coldCount: 24,
    convertedCount: 5,
  },
  {
    id: "camp_2",
    name: "Social Media Ads Campaign Q2",
    source: "facebook",
    isActive: true,
    leadCount: 120,
    hotCount: 30,
    warmCount: 40,
    coldCount: 50,
    convertedCount: 12,
  },
  {
    id: "camp_3",
    name: "Email Newsletter Reactivation",
    source: "email",
    isActive: false,
    leadCount: 200,
    hotCount: 15,
    warmCount: 25,
    coldCount: 160,
    convertedCount: 2,
  },
];

export const MOCK_FOLLOWUPS: FollowUp[] = [
  {
    id: "follow_1",
    lead: {
      id: "lead_2",
      name: "Rohit Verma",
      phone: "9123456780",
      classification: "warm"
    },
    channel: "whatsapp",
    status: "ready",
    message: "Hi Rohit, thanks for speaking with us. Here is the onboarding link...",
    waMeLink: "https://wa.me/919123456780?text=Hi Rohit",
    createdAt: "2026-05-10T09:10:00Z",
  },
  {
    id: "follow_2",
    lead: {
      id: "lead_4",
      name: "Vikram Singh",
      phone: "9871234560",
      classification: "warm"
    },
    channel: "whatsapp",
    status: "sent",
    message: "Hi Vikram, just checking in on your profile setup.",
    waMeLink: "https://wa.me/919871234560?text=Hi Vikram",
    createdAt: "2026-05-12T14:20:00Z",
  }
];

export const MOCK_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: "doc_1",
    title: "Standard Broker Pitch Script",
    type: "Script",
    isActive: true,
    updatedAt: "2026-04-10T10:00:00Z"
  },
  {
    id: "doc_2",
    title: "Commission & Payouts FAQ",
    type: "FAQ",
    isActive: true,
    updatedAt: "2026-04-12T11:00:00Z"
  },
  {
    id: "doc_3",
    title: "Competitor Handling Guide",
    type: "Objection Guide",
    isActive: true,
    updatedAt: "2026-05-01T09:30:00Z"
  }
];

export const MOCK_FEEDBACK: Feedback[] = [
  {
    id: "feedback_1",
    leadId: "lead_1",
    leadName: "Amit Sharma",
    rmId: "user_2",
    rmName: "Shivansh Mishra",
    originalClassification: "hot",
    correctedClassification: "warm",
    originalScore: 82,
    correctedScore: 65,
    feedbackType: "score_wrong",
    comment: "Lead was interested but not ready for onboarding. Need some more time to discuss terms.",
    createdAt: "2026-05-02T11:00:00Z"
  }
];

