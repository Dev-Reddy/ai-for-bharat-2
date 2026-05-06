import { CheckCircle2, Lock, Sparkles, Workflow } from "lucide-react";

export default function Solution() {
  return (
    <section id="solution" className="w-full py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-accent-primary mb-3">The Solution</h2>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-text-1 tracking-tight leading-[1.05]">
                An AI conversion layer before the RM.
              </p>
            </div>
            
            <p className="text-lg text-text-2 leading-relaxed">
              LeadOS contacts leads immediately, runs a structured sales conversation, handles objections naturally, scores the lead, and routes the right next step automatically.
            </p>

            <ul className="space-y-4 pt-4">
              {[
                "Multilingual AI chat and voice conversations",
                "Structured sales flow based on approved scripts and FAQs",
                "Natural handling for the five core objections",
                "Explainable Hot, Warm, and Cold scoring",
                "RM handoff with summary, transcript, objections, and suggested opening line",
                "WhatsApp follow-up links for Warm leads",
                "Admin analytics for funnel, language, and objection trends"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-accent-primary mt-0.5 shrink-0" />
                  <span className="ml-3 text-text-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Flow Diagram Graphic */}
          <div className="relative w-full aspect-square max-w-md mx-auto lg:mr-0 lg:max-w-none lg:aspect-[4/3] bg-bg-soft rounded-3xl border border-border-subtle p-8 overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-bg-primary/50 to-transparent pointer-events-none" />
             
             <div className="relative h-full flex flex-col justify-between pt-4">
                {/* Simulated interface elements */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-border-subtle shadow-sm translate-y-4 z-10 transition-base hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">JD</div>
                    <div>
                      <div className="text-xs font-bold text-text-1">Lead Captured</div>
                      <div className="text-[10px] text-slate-500 mb-1">Web form / Campaign</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full uppercase">Source</div>
                </div>

                <div className="flex justify-center -my-2 z-0">
                  <div className="w-0.5 h-10 bg-gradient-to-b from-border-subtle to-accent-secondary"></div>
                </div>

                <div className="flex items-center justify-center p-4 bg-text-1 rounded-xl shadow-lg relative z-10 transition-base hover:scale-[1.02]">
                   <Sparkles className="w-5 h-5 text-accent-secondary mr-3" />
                   <span className="text-bg-primary text-sm font-medium tracking-wide">AI Conversation & Objection Handling</span>
                </div>

                <div className="flex justify-center -my-2 z-0">
                  <div className="w-0.5 h-10 bg-gradient-to-b from-text-1 to-accent-primary"></div>
                </div>
                
                <div className="flex items-center justify-center p-3 w-48 mx-auto bg-white rounded-xl border border-blue-200 shadow-md relative z-10 transition-base hover:scale-[1.02]">
                   <span className="text-blue-700 text-xs font-bold tracking-wide">Score Generated</span>
                </div>

                <div className="flex justify-between px-8 -my-2 z-0 relative">
                  <div className="w-0.5 h-12 bg-border-subtle transform -rotate-12 translate-x-4 border-l border-dashed"></div>
                  <div className="w-0.5 h-12 bg-gradient-to-b from-accent-primary to-emerald-500"></div>
                  <div className="w-0.5 h-12 bg-border-subtle transform rotate-12 -translate-x-4 border-l border-dashed"></div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 z-10">
                  <div className="p-2 sm:p-3 bg-white rounded-lg border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center opacity-60">
                    <div className="text-[10px] text-text-2 font-medium">Closed</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-white rounded-lg border-2 border-emerald-500 shadow-md flex flex-col items-center justify-center text-center transition-base hover:-translate-y-1 cursor-pointer">
                    <span className="text-xl sm:text-2xl mb-1">🔥</span>
                    <div className="text-[10px] sm:text-xs font-bold text-text-1">RM Handoff</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-white rounded-lg border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center opacity-80">
                    <span className="text-xl sm:text-2xl mb-1">💬</span>
                    <div className="text-[10px] sm:text-xs font-semibold text-text-1 leading-tight">WhatsApp Follow-up</div>
                  </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
