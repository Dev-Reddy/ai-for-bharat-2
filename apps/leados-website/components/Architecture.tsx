import { Database, Box } from "lucide-react";

export default function Architecture() {
  return (
    <section id="architecture" className="w-full py-24 sm:py-32 bg-bg-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-accent-primary mb-3">Enterprise Architecture</h2>
            <p className="text-3xl sm:text-4xl font-display font-bold text-text-1 tracking-tight leading-[1.05] mb-6">
              Built as a modular AI lead conversion stack.
            </p>
            <p className="text-lg text-text-2 leading-relaxed mb-8">
              LeadOS uses a clean API-first architecture with Supabase, OpenAI, Vapi, LangGraph-style orchestration, knowledge retrieval, scoring, routing, and dashboard analytics.
            </p>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                 <div>
                   <h4 className="text-sm font-bold text-text-1 mb-1">Lead Capture Layer</h4>
                   <p className="text-xs text-text-2">Website forms, demo client page, campaign/API inputs</p>
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-text-1 mb-1">Conversation Layer</h4>
                   <p className="text-xs text-text-2">AI chat, Vapi voice, transcript events</p>
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-text-1 mb-1">AI Intelligence Layer</h4>
                   <p className="text-xs text-text-2">OpenAI, structured prompts, objection handling, scoring</p>
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-text-1 mb-1">Knowledge Layer</h4>
                   <p className="text-xs text-text-2">Sales script, FAQ, onboarding guide, objection guide</p>
                 </div>
              </div>
              <div className="pt-6 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                 <div>
                   <h4 className="text-sm font-bold text-text-1 mb-1">Workflow Layer</h4>
                   <p className="text-xs text-text-2">Routing, RM tasks, WhatsApp follow-ups, notifications</p>
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-text-1 mb-1">Data Layer</h4>
                   <p className="text-xs text-text-2">Supabase Auth, Supabase Postgres, Edge Functions</p>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full">
            <div className="relative border border-border-subtle rounded-3xl bg-bg-primary p-8 shadow-sm">
               {/* Abstract Stack graphic */}
               <div className="space-y-4 relative z-10">
                 <div className="glass-card rounded-xl p-4 flex items-center justify-between hover:border-accent-primary transition-colors">
                   <span className="text-sm font-bold">Portal Layer</span>
                   <span className="text-xs text-text-2">Admin & RM Portal</span>
                 </div>
                 
                 <div className="flex justify-center -my-2"><div className="w-0.5 h-6 bg-border-subtle"></div></div>
                 
                 <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between shadow-md">
                   <span className="text-sm font-bold text-white">AI Intelligence Layer</span>
                   <span className="px-2 py-1 bg-white/20 text-white text-[10px] rounded uppercase font-bold tracking-wider">Core</span>
                 </div>

                 <div className="flex justify-center -my-2"><div className="w-0.5 h-6 bg-border-subtle"></div></div>

                 <div className="glass-card rounded-xl p-4 flex items-center justify-between hover:border-accent-primary transition-colors">
                   <span className="text-sm font-bold">Data & Workflow Node</span>
                   <Database className="w-4 h-4 text-text-2" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
