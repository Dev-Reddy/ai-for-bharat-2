import { useQuery } from "@tanstack/react-query";
import { rmApi } from "../../services/rmApi";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";
import { useParams } from "@tanstack/react-router";

export const LeadDetail = () => {
  const { leadId } = useParams({ strict: false });
  const { data, isLoading } = useQuery({ 
    queryKey: ['lead-detail', leadId], 
    queryFn: () => rmApi.getRMLeadDetail(leadId || "") ,
    enabled: Boolean(leadId),
  });

  // Safety Gate: If loading, show a nice skeleton
  if (isLoading) return <div className="p-10 text-slate-400 animate-pulse">Loading Lead Context...</div>;
  
  // If data is missing for some reason, show error
  if (!data) return <div className="p-10 text-red-500 font-bold">Lead data not found.</div>;

  // Destructure safely
  const lead = data.lead;
  const score = data.score;
  const messages = data.messages;
  const rmTask = data.rmTask;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto font-sans">
      
      {/* HEADER SECTION */}
      <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{lead?.name}</h1>
            <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-black uppercase tracking-widest">
              {lead?.classification} LEAD
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">{lead?.role} • {lead?.city} • {lead?.preferredLanguage}</p>
        </div>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-xl text-center min-w-[120px]">
           <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">AI Score</p>
           <p className="text-4xl font-black">{lead?.latestScore}</p>
        </div>
      </div>

      {/* LEFT CONTENT: AI INTELLIGENCE */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Summary Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
            <MessageSquare size={14}/> AI Summary
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
            {lead?.latestSummary}
          </p>
        </div>

        {/* Objections (Section 11 Requirement) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Core Objections Handled</h3>
          <div className="space-y-3">
            {score?.objections?.map((obj: any, i: number) => (
              <div key={i} className="p-4 border border-amber-100 bg-amber-50/30 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{obj.type}</span>
                  <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">Resolved by AI</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 italic">"{obj.leadStatement}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Transcript</div>
           <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
              {messages?.map((m: any) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none font-medium'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* RIGHT CONTENT: RM ACTIONS */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
           <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Recommended Next Action</h3>
           <p className="text-lg font-bold mb-6">{score?.recommendedNextAction}</p>
           
           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-t border-slate-800 pt-4">Opening Line</h3>
           <p className="text-sm italic text-slate-300">"{rmTask?.suggestedOpeningLine}"</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
           <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all">
             <CheckCircle size={18}/> Mark Converted
           </button>
           <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
             <Clock size={18}/> Follow up later
           </button>
           <button className="w-full py-2 text-slate-400 text-xs font-bold uppercase hover:text-red-500 transition-colors">
             Close Lead
           </button>
        </div>
      </div>

    </div>
  );
};
