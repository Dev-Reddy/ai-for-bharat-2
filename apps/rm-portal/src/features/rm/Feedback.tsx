import { MOCK_RM_DATA } from "../../mocks/rm.mock";
import { Send } from "lucide-react";

export const Feedback = () => {
  return (
    <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Submit AI Performance Feedback</h3>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Lead</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                {MOCK_RM_DATA.myLeads.map(l => <option key={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Corrected Classification</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                <option>Hot</option>
                <option>Warm</option>
                <option>Cold</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Comments</label>
            <textarea 
              placeholder="What did the AI miss?"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none h-32"
            ></textarea>
          </div>
          <button type="button" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            Submit Feedback <Send size={16}/>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback History</div>
        <div className="divide-y divide-slate-100 text-sm">
          {MOCK_RM_DATA.feedbackHistory.map(f => (
            <div key={f.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{f.leadName}</p>
                <p className="text-xs text-slate-500 mt-1">{f.comment}</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-blue-500 uppercase bg-blue-50 px-2 py-1 rounded tracking-tighter">Corrected: {f.correctedClass}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};