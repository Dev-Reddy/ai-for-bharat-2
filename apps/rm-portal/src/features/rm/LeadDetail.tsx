import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Bot, MessageCircle, Phone, PhoneCall, RefreshCcw, UserRound } from "lucide-react";
import { rmApi } from "../../services/rmApi";

function formatDateTime(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export const LeadDetail = () => {
  const { leadId } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["lead-detail", leadId],
    queryFn: () => rmApi.getRMLeadDetail(leadId || ""),
    enabled: Boolean(leadId),
  });

  const scheduleCallMutation = useMutation({
    mutationFn: () => rmApi.scheduleLeadCall(leadId || ""),
    onSuccess: () => window.alert("Call scheduled"),
    onError: () => window.alert("Failed to schedule call"),
  });

  const rerunMutation = useMutation({
    mutationFn: () => rmApi.runLeadAnalysis(leadId || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-detail", leadId] });
      queryClient.invalidateQueries({ queryKey: ["rm-leads"] });
    },
  });

  const openFollowUpMutation = useMutation({
    mutationFn: () => {
      if (!data?.followUp?.id) throw new Error("Missing follow-up");
      return rmApi.openFollowUpLink(data.followUp.id);
    },
    onSuccess: (payload: { waMeLink?: string }) => {
      if (payload?.waMeLink) {
        window.open(payload.waMeLink, "_blank", "noopener,noreferrer");
      }
      queryClient.invalidateQueries({ queryKey: ["lead-detail", leadId] });
    },
    onError: () => window.alert("Failed to open WhatsApp link"),
  });

  if (isLoading) return <div className="p-10 text-slate-400 animate-pulse">Loading Lead Context...</div>;
  if (!data) return <div className="p-10 text-red-500 font-bold">Lead data not found.</div>;

  const lead = data.lead;
  const score = data.score as {
    totalScore?: number;
    interestLevelScore?: number;
    readinessToSignupScore?: number;
    networkSizeScore?: number;
    reason?: string;
    detectedLanguage?: string | null;
    recommendedNextAction?: string;
    suggestedOpeningLine?: string;
    objections?: Array<{ type: string; status: string; leadStatement: string; aiResponseSummary?: string }>;
  };
  const messages = data.messages ?? [];
  const rmTask = data.rmTask as {
    suggestedOpeningLine?: string | null;
    recommendedAction?: string | null;
  } | null;
  const followUp = data.followUp as { id?: string; waMeLink?: string | null } | null;
  const transcriptSource = data.latestTranscriptSource;

  const waFromFollowUp = followUp?.waMeLink;
  const canOpenWhatsApp = Boolean(waFromFollowUp || data.leadWaMeLink);

  return (
    <div className="max-w-7xl mx-auto font-sans space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{lead?.name}</h1>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                lead?.classification === "hot"
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : lead?.classification === "warm"
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                    : "bg-cyan-50 text-cyan-700 border border-cyan-100"
              }`}
            >
              {lead?.classification} LEAD
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {lead?.phone} • {lead?.preferredLanguage || "unknown language"} • {lead?.preferredChannel || "chat"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canOpenWhatsApp ? (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold"
              onClick={() =>
                followUp?.id
                  ? openFollowUpMutation.mutate()
                  : window.open(data.leadWaMeLink as string, "_blank", "noopener,noreferrer")
              }
              disabled={openFollowUpMutation.isPending}
            >
              <MessageCircle size={18} /> Open WhatsApp
            </button>
          ) : null}
          {data.canStartCall ? (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold hover:bg-slate-50"
              onClick={() => scheduleCallMutation.mutate()}
              disabled={scheduleCallMutation.isPending}
            >
              <PhoneCall size={18} /> {scheduleCallMutation.isPending ? "Calling…" : "Call now"}
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold hover:bg-slate-50"
            onClick={() => rerunMutation.mutate()}
            disabled={rerunMutation.isPending}
          >
            <RefreshCcw size={18} /> {rerunMutation.isPending ? "Running…" : "Analyze again"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900">Lead Analysis</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1 mb-4">
              {transcriptSource === "call_thread" ? "Voice call transcript" : "Chat transcript"} analyzed for lead
              qualification.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detected Language</div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  {score?.detectedLanguage || lead?.preferredLanguage || "unknown"}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Action</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {score?.recommendedNextAction || lead?.latestNextAction || "Review lead manually"}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">{score?.reason || "Analysis pending."}</p>
          </section>

          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Objections And Handling</h3>
            <div className="space-y-3">
              {score?.objections?.length ? (
                score.objections.map((obj, i) => (
                  <div key={i} className="p-4 border border-amber-100 bg-amber-50/30 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{obj.type}</span>
                      <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">
                        {obj.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 italic">"{obj.leadStatement}"</p>
                    {obj.aiResponseSummary ? <p className="mt-2 text-xs text-slate-600">{obj.aiResponseSummary}</p> : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No objection details captured.</div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversation Transcript</h3>
              <p className="text-xs text-slate-500 mt-1">
                {messages.length
                  ? `${messages.length} messages captured`
                  : "No message transcript available"}
                {transcriptSource === "call_thread" ? " · Voice call transcript" : transcriptSource ? " · Chat transcript" : ""}
              </p>
            </div>
            <div className="p-6 space-y-4 max-h-[520px] overflow-y-auto">
              {messages.length ? (
                messages.map((m: { id: string; role: string; content: string }) => (
                  <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-3 rounded-xl text-sm max-w-[82%] ${
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-slate-100 text-slate-800 rounded-tl-none font-medium"
                      }`}
                    >
                      <div className="mb-1 text-[10px] uppercase tracking-widest opacity-70">
                        {m.role === "assistant" ? "AI Agent" : lead?.name}
                      </div>
                      {m.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No transcript messages available.</div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900">Scorecard</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">Scoring on interest, readiness, and network fit.</p>
            <div className="rounded-2xl bg-slate-900 p-5 text-white mb-4">
              <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Total Score</div>
              <div className="mt-2 text-5xl font-black tabular-nums">{score?.totalScore ?? lead?.latestScore ?? 0}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-slate-200 p-3 text-center">
                <div className="text-lg font-black text-slate-900 tabular-nums">
                  {score?.interestLevelScore ?? lead?.interestLevelScore ?? 0}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 text-center">
                <div className="text-lg font-black text-slate-900 tabular-nums">
                  {score?.readinessToSignupScore ?? lead?.readinessToSignupScore ?? 0}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Readiness</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 text-center">
                <div className="text-lg font-black text-slate-900 tabular-nums">
                  {score?.networkSizeScore ?? lead?.networkSizeScore ?? 0}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network</div>
              </div>
            </div>
            <p className="text-sm text-slate-600">{score?.reason || "Analysis pending."}</p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900">Handoff Context</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">What to use before continuing the conversation.</p>
            <div className="rounded-xl border border-slate-200 p-4 mb-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RM Opening Line</div>
              <div className="mt-2 text-sm text-slate-900">
                {rmTask?.suggestedOpeningLine ||
                  score?.suggestedOpeningLine ||
                  lead?.handoffSummary ||
                  "Continue naturally from the AI summary."}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 mb-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Action</div>
              <div className="mt-2 text-sm text-slate-900">
                {rmTask?.recommendedAction || score?.recommendedNextAction || "Review transcript and decide next step."}
              </div>
            </div>
            {score?.objections?.length ? (
              <div className="space-y-3">
                {score.objections.map((objection, index) => (
                  <div key={`${objection.type}-${index}`} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-900">{objection.type}</div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 border border-slate-200 rounded px-2 py-0.5">
                        {objection.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">{objection.leadStatement}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No objection details captured.</div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900">Lead Profile</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" /> {lead?.phone}
              </div>
              <div className="flex items-center gap-3">
                <UserRound className="h-4 w-4 shrink-0 text-slate-400" /> {lead?.city || "Unknown city"}
              </div>
              <div className="flex items-center gap-3">
                <Bot className="h-4 w-4 shrink-0 text-slate-400" /> {lead?.preferredChannel || "chat"}
              </div>
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">Created {formatDateTime(lead?.createdAt)}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
