import { ArrowRight, Bot, Target, Users, Zap } from "lucide-react";
import { APP_URLS } from "@/lib/app-urls";

export default function Hero() {
  return (
    <section id="hero" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 pb-24 flex flex-col xl:flex-row gap-12 relative overflow-hidden">
      {/* Left Content */}
      <div className="flex-1 flex flex-col gap-6 max-w-[520px] mx-auto xl:mx-0 text-center xl:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 w-fit mx-auto xl:mx-0">
          <span className="flex h-2 w-2 rounded-full bg-accent-primary animate-pulse"></span>
          <span className="text-[11px] font-bold text-accent-primary uppercase tracking-wider">AI Lead Conversion Platform</span>
        </div>
        
        <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-bold leading-[1.05] tracking-tight text-text-1">
          Turn raw leads into <span className="accent-gradient">RM-ready</span> opportunities <br className="hidden sm:block" /> with multilingual AI.
        </h1>
        
        <p className="text-lg text-text-2 leading-relaxed">
          LeadOS engages every lead instantly through chat or voice, speaks in the lead&apos;s preferred language, handles common objections, scores intent, and hands Hot leads to relationship managers with full conversation context.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4 pt-4">
          <a href="#cta" className="btn-primary px-8 py-4 text-base font-semibold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 w-full sm:w-auto">
            Try Live Demo
            <ArrowRight className="h-5 w-5" />
          </a>
          <a href={APP_URLS.adminPortal} className="px-8 py-4 border border-border-subtle rounded-full text-base font-semibold text-text-1 bg-bg-primary hover:bg-slate-50 transition-colors w-full sm:w-auto text-center">
            View Admin Portal
          </a>
          <a href={APP_URLS.rmPortal} className="px-8 py-4 border border-border-subtle rounded-full text-base font-semibold text-text-1 bg-bg-primary hover:bg-slate-50 transition-colors w-full sm:w-auto text-center">
            Open RM Portal
          </a>
        </div>
      </div>

      {/* Right Visualizer */}
      <div className="flex-1 relative mt-16 xl:mt-0 max-w-xl mx-auto w-full">
        <div className="relative w-full bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[40px] border border-white p-6 sm:p-8 overflow-hidden shadow-lg shadow-blue-900/5">
          <div className="relative h-full w-full flex flex-col gap-4 overflow-hidden">
            
            {/* Flow Card 1: Lead */}
            <div className="glass-card w-[260px] p-4 rounded-2xl self-start transform -rotate-1 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incoming Lead</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-bold uppercase">Live</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">AS</div>
                <div>
                  <div className="text-xs font-bold text-text-1">Amit Sharma</div>
                  <div className="text-[10px] text-slate-500">Financial Advisor · Hyderabad</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                Preferred Language: <span className="font-semibold text-text-1">Hinglish</span>
              </div>
            </div>

            {/* AI Agent Connection Line */}
            <div className="absolute left-[130px] top-[120px] w-[2px] h-full bg-gradient-to-b from-accent-primary via-accent-secondary to-transparent z-0 hidden sm:block"></div>
            
            {/* Flow Card 2: AI Scoring */}
            <div className="glass-card w-full sm:w-[320px] p-5 rounded-2xl self-center sm:translate-x-8 z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-text-1">AI Lead Analysis</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                  <span className="text-[10px] font-medium text-slate-500">Intent Score: <span className="font-bold text-text-1">82 / 100</span></span>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase">Hot</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-100 grid gap-1 relative overflow-hidden">
                   <div className="text-[9px] font-bold text-slate-400 uppercase">Reason</div>
                   <div className="text-[10px] text-text-2 leading-relaxed">Asked for onboarding details, has 25 to 30 finance contacts, and existing broker objection was resolved.</div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                   <div className="text-[10px] font-medium text-emerald-800">Next Action: Assign to RM with suggested opening line.</div>
                </div>
              </div>
            </div>

            {/* Flow Card 3: Objection */}
            <div className="glass-card w-[260px] p-4 rounded-2xl self-end transform rotate-1 sm:-translate-y-2 relative z-10 hidden sm:block">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-orange-500 mt-0.5">Objection:</span>
                  <span className="text-[11px] text-text-1 italic">&quot;I already have another broker.&quot;</span>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-blue-500 mt-0.5">AI Reply:</span>
                  <span className="text-[11px] text-slate-600">Compared revenue share, fast payouts, and partner support without sounding scripted.</span>
                </div>
              </div>
            </div>

            {/* Flow Card 4: Action */}
            <div className="glass-card w-[240px] p-4 rounded-2xl self-start sm:translate-x-4 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-1">RM Handoff Ready</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Transcript</span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Score Reason</span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Objections</span>
                <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Suggested Opening Line</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
