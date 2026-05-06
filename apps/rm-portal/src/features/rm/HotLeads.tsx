import { useQuery } from "@tanstack/react-query";
import { rmApi } from "../../services/rmApi";
import { Flame, ChevronRight } from "lucide-react";

export const HotLeads = ({ onSelectLead }: { onSelectLead: (id: string) => void }) => {
  const { data } = useQuery({ queryKey: ['rm-dash'], queryFn: rmApi.getRMDashboardOverview });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.hotLeads.map((lead: any) => (
          <div key={lead.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <Flame size={20} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Score</p>
                <p className="text-3xl font-black text-blue-600">{lead.latestScore}</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">{lead.name}</h3>
            <p className="text-sm text-slate-500 font-medium mb-4">{lead.preferredLanguage} • {lead.mainObjection}</p>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">Ready for Handoff</p>
            </div>

            <button 
              onClick={() => onSelectLead(lead.id)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all group"
            >
              Open Context <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};