
export const MOCK_RM_DATA = {
  dashboard: {
    overview: { assignedHotLeads: 8, pendingTasks: 6, followUpsDue: 3, convertedLeads: 5, closedLeads: 2, averageLeadScore: 76 },
    hotLeads: [
      { id: '1', name: "Amit Sharma", latestScore: 82, mainObjection: "Existing Broker", preferredLanguage: "Hinglish" },
      { id: '2', name: "Priya Mehta", latestScore: 78, mainObjection: "Trust Concern", preferredLanguage: "Hindi" },
      { id: '3', name: "Rahul Verma", latestScore: 71, mainObjection: "Support Process", preferredLanguage: "English" }
    ],
    notifications: [
      { id: 'n1', title: "New Hot Lead Assigned", message: "Amit Sharma classified as Hot." }
    ]
  },
  // ADD THIS: For the Follow Ups Page
  followUps: [
    { 
      id: 'f1', 
      leadName: "Neha Rao", 
      phone: "919876543212", 
      status: "ready", 
      message: "Hi Neha, thanks for speaking with our AI. Here is the link to compare our daily payout structure...",
      waLink: "https://wa.me/919876543212?text=Hi%20Neha"
    },
    { 
      id: 'f2', 
      leadName: "Vikram Singh", 
      phone: "919876543213", 
      status: "sent", 
      message: "Hi Vikram, following up on your trust concerns. Attached are our license details.",
      waLink: "#"
    }
  ],
  leadDetail: {
    lead: { id: "1", name: "Amit Sharma", role: "Financial Advisor", city: "Hyderabad", preferredLanguage: "Hinglish", classification: "hot", latestScore: 82, latestSummary: "Lead is highly interested in fast payouts. Currently with another broker." },
    score: { readinessScore: 34, engagementScore: 29, fitScore: 19, recommendedNextAction: "Call today before 6 PM.", objections: [{ type: "Existing Broker", leadStatement: "I already have another broker.", aiResponseSummary: "AI handled by comparing share." }] },
    rmTask: { suggestedOpeningLine: "Hi Amit, I saw you were interested in our payout structure..." },
    messages: [
      { id: "m1", role: "assistant", content: "Hi Amit, I can explain the program." },
      { id: "m2", role: "user", content: "I have another broker already." }
    ]
  },
  myLeads: [
    { id: '1', name: "Amit Sharma", status: "assigned_to_rm", classification: "hot", latestScore: 82, preferredLanguage: "Hinglish", createdAt: "2026-05-02" },
    { id: '2', name: "Priya Mehta", status: "follow_up_scheduled", classification: "warm", latestScore: 58, preferredLanguage: "Hindi", createdAt: "2026-05-02" },
    { id: '3', name: "Rahul Verma", status: "closed", classification: "cold", latestScore: 15, preferredLanguage: "English", createdAt: "2026-05-01" },
  ],
  feedbackHistory: [
    { id: 'fb1', leadName: "Amit Sharma", originalClass: "hot", correctedClass: "warm", type: "score_wrong", comment: "Lead is interested but not ready to commit yet." }
  ]
};