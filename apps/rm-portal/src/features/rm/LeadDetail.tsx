import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { CheckCircle, Clock, MessageCircle, PhoneCall } from "lucide-react";
import { rmApi } from "../../services/rmApi";

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

  const openFollowUpMutation = useMutation({
    mutationFn: () => {
      if (!data?.followUp?.id) throw new Error("Missing follow-up");
      return rmApi.openFollowUpLink(data.followUp.id);
    },
    onSuccess: (payload: any) => {
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
  const score = data.score;
  const messages = data.messages;
  const rmTask = data.rmTask;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto font-sans">
      <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{lead?.name}</h1>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              lead?.classification === "hot"
                ? "bg-red-50 text-red-600 border border-red-100"
                : lead?.classification === "warm"
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                  : "bg-cyan-50 text-cyan-700 border border-cyan-100"
            }`}>
              {lead?.classification} LEAD
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">{lead?.role} • {lead?.city} • {lead?.preferredLanguage}</p>
        </div>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-xl text-center min-w-[120px]">
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">AI Score</p>
          <p className="text-4xl font-black">{score?.totalScore ?? lead?.latestScore}</p>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase mb-4">AI Summary</h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
            {lead?.latestSummary || score?.reason}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Objections And Handling</h3>
          <div className="space-y-3">
            {score?.objections?.length ? score.objections.map((obj: any, i: number) => (
              <div key={i} className="p-4 border border-amber-100 bg-amber-50/30 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{obj.type}</span>
                  <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">
                    {obj.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 italic">"{obj.leadStatement}"</p>
                <p className="mt-2 text-xs text-slate-600">{obj.aiResponseSummary}</p>
              </div>
            )) : <div className="text-sm text-slate-500">No objection details captured.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Transcript</div>
          <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto">
            {messages?.map((m: any) => (
              <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none font-medium"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Recommended Next Action</h3>
          <p className="text-lg font-bold mb-6">{score?.recommendedNextAction}</p>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-t border-slate-800 pt-4">Opening Line</h3>
          <p className="text-sm italic text-slate-300">"{rmTask?.suggestedOpeningLine || lead?.handoffSummary}"</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
          {data.followUp?.waMeLink && (
            <button
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
              onClick={() => openFollowUpMutation.mutate()}
            >
              <MessageCircle size={18} /> Open WhatsApp
            </button>
          )}
          <button
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-50"
            onClick={() => scheduleCallMutation.mutate()}
          >
            <PhoneCall size={18} /> Schedule Call
          </button>
          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all">
            <CheckCircle size={18} /> Mark Converted
          </button>
          <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
            <Clock size={18} /> Follow up later
          </button>
        </div>
      </div>
    </div>
  );
};
