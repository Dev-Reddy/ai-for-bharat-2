import { MOCK_RM_DATA } from "../../mocks/rm.mock";
import {  ExternalLink, CheckCircle2 } from "lucide-react";

export const FollowUps = () => {
  const followUps = MOCK_RM_DATA.followUps;

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
          {followUps.map((f) => (
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
                  f.status === 'ready' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}>
                  {f.status}
                </span>
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2 text-sans">
                  <a 
                    href={f.waLink} 
                    target="_blank" 
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center gap-2 text-xs font-bold px-4"
                  >
                    WhatsApp <ExternalLink size={14}/>
                  </a>
                  <button className="p-2 border border-slate-200 text-slate-400 hover:text-blue-600 rounded-lg transition-all">
                    <CheckCircle2 size={18}/>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};