
import { useQuery } from "@tanstack/react-query";
import { rmApi } from "../../services/rmApi";

import { useNavigate } from "@tanstack/react-router";

export const RMDashboard = () => {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['rm-dash'], queryFn: rmApi.getRMDashboardOverview });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Hot Leads" value={data?.overview.assignedHotLeads} color="text-red-600" />
        <StatCard label="Pending" value={data?.overview.pendingTasks} color="text-blue-600" />
        <StatCard label="Follow Ups" value={data?.overview.followUpsDue} color="text-amber-600" />
        <StatCard label="Converted" value={data?.overview.convertedLeads} color="text-green-600" />
        <StatCard label="Closed" value={data?.overview.closedLeads} color="text-slate-400" />
        <StatCard label="Avg Score" value={`${data?.overview.averageLeadScore}%`} color="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hot Lead Queue */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sans">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Priority Hot Leads</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.hotLeads.map((lead: any) => (
              <div key={lead.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{lead.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{lead.mainObjection} • {lead.preferredLanguage}</p>
                </div>
                <button 
                  onClick={() => navigate({ to: '/rm/leads/$leadId', params: { leadId: lead.id } })}
                  className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                >
                  View Handoff
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sans">
           <div className="p-5 border-b border-slate-100 font-bold text-slate-800 uppercase text-xs tracking-widest bg-slate-50/50">Recent Notifications</div>
           <div className="p-5 space-y-4">
              {data?.notifications.map((n: any) => (
                <div key={n.id} className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                   <div>
                     <p className="text-sm font-bold text-slate-900">{n.title}</p>
                     <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sans">
    <div className="flex flex-col">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  </div>
);