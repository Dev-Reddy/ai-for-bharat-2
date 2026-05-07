import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { rmApi } from "../../services/rmApi";

export const FollowUps = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["rm-followups"],
    queryFn: rmApi.getRMFollowUps,
  });

  const openMutation = useMutation({
    mutationFn: (followUpId: string) => rmApi.openFollowUpLink(followUpId),
    onSuccess: (payload: any) => {
      if (payload?.waMeLink) {
        window.open(payload.waMeLink, "_blank", "noopener,noreferrer");
      }
      queryClient.invalidateQueries({ queryKey: ["rm-followups"] });
    },
  });

  const followUps = data ?? [];

  if (isLoading) {
    return <div className="p-8 text-slate-400 animate-pulse">Loading follow-ups...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <tr>
            <th className="px-6 py-4">Lead Name</th>
            <th className="px-6 py-4">AI Message Preview</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {followUps.length ? followUps.map((f: any) => (
            <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-5">
                <p className="font-bold text-slate-900">{f.leadName}</p>
                <p className="text-xs text-slate-500 font-medium">{f.phone}</p>
              </td>
              <td className="px-6 py-5 max-w-md">
                <p className="text-xs text-slate-600 italic line-clamp-2 leading-relaxed bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                  "{f.message}"
                </p>
              </td>
              <td className="px-6 py-5 text-sans">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  f.status === "ready"
                    ? "bg-amber-100 text-amber-700"
                    : f.status === "opened"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                }`}>
                  {f.status}
                </span>
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2 text-sans">
                  {f.waLink && (
                    <a
                      href={f.waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center gap-2 text-xs font-bold px-4"
                    >
                      WhatsApp <ExternalLink size={14} />
                    </a>
                  )}
                  {f.status === "ready" && (
                    <button
                      className="p-2 border border-slate-200 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                      onClick={() => openMutation.mutate(f.id)}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                No follow-ups available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
