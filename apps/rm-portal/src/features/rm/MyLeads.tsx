import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { rmApi } from "../../services/rmApi";
import { Calendar, Filter, Plus, Search } from "lucide-react";

export const MyLeads = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    preferredLanguage: "english",
    preferredContactMethod: "chat_now" as "chat_now" | "call_under_5_min",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["rm-leads"],
    queryFn: () => rmApi.getRMLeads(),
  });

  const createLeadMutation = useMutation({
    mutationFn: rmApi.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rm-leads"] });
      setIsDialogOpen(false);
      setFormState({
        name: "",
        phone: "",
        email: "",
        address: "",
        preferredLanguage: "english",
        preferredContactMethod: "chat_now",
      });
    },
  });

  const leads = useMemo(() => {
    const all = data ?? [];
    if (!search.trim()) {
      return all;
    }

    const query = search.toLowerCase();
    return all.filter(
      (lead: any) =>
        lead.name.toLowerCase().includes(query) ||
        lead.phone.includes(query),
    );
  }, [data, search]);

  if (isLoading) {
    return <div className="p-10 text-slate-400 animate-pulse">Loading assigned leads...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search leads by name or phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={14} /> Assigned Only
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Calendar size={14} /> Active Queue
          </button>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 border border-blue-600 rounded-xl text-xs font-bold text-white hover:bg-blue-700 transition-all"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {isDialogOpen && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Create lead for yourself</h3>
            <button onClick={() => setIsDialogOpen(false)} className="text-sm text-slate-500">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} placeholder="Full name" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            <input value={formState.phone} onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone number" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            <input value={formState.email} onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            <input value={formState.address} onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))} placeholder="Address" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            <select value={formState.preferredLanguage} onChange={(event) => setFormState((prev) => ({ ...prev, preferredLanguage: event.target.value }))} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="hinglish">Hinglish</option>
            </select>
            <select value={formState.preferredContactMethod} onChange={(event) => setFormState((prev) => ({ ...prev, preferredContactMethod: event.target.value as "chat_now" | "call_under_5_min" }))} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
              <option value="chat_now">Chat now</option>
              <option value="call_under_5_min">Call in under 5 minutes</option>
            </select>
          </div>
          <button
            onClick={() => createLeadMutation.mutate(formState)}
            disabled={!formState.name || !formState.phone || createLeadMutation.isPending}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {createLeadMutation.isPending ? "Creating..." : "Create lead"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-5">Lead Identity</th>
                <th className="px-6 py-5">Language</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Recommended Action</th>
                <th className="px-6 py-5 text-right font-black">AI Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead: any) => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50/50 transition-all cursor-pointer group"
                  onClick={() => navigate({ to: "/rm/leads/$leadId", params: { leadId: lead.id } })}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        lead.classification === "hot" ? "bg-red-500 animate-pulse" :
                        lead.classification === "warm" ? "bg-orange-400" : "bg-slate-300"
                      }`} />
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{lead.name}</p>
                        <p className="text-xs text-slate-400 font-medium tracking-tight">ID: {lead.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-tighter border border-slate-200/50">
                      {lead.preferredLanguage}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                      lead.classification === "hot" ? "bg-red-50 text-red-600 border-red-100" :
                      lead.classification === "warm" ? "bg-orange-50 text-orange-600 border-orange-100" :
                      "bg-slate-50 text-slate-400 border-slate-200"
                    }`}>
                      {lead.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-semibold text-slate-600">
                      {lead.latestNextAction || "Review latest AI summary"}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-xl text-blue-600 tabular-nums">
                    {lead.latestScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {leads.length} assigned leads
          </p>
        </div>
      </div>
    </div>
  );
};
