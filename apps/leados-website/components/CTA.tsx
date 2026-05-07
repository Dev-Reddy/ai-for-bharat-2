import { ArrowRight, Lock } from "lucide-react";
import { APP_URLS } from "@/lib/app-urls";

export default function CTA() {
  return (
    <section id="cta" className="w-full py-24 sm:py-32 relative overflow-hidden bg-white border-t border-border-subtle">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-50" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-[64px] font-display font-bold text-text-1 tracking-tight leading-[1.05] mb-6">
          See the full lead conversion <br/>
          <span className="accent-gradient">flow in action.</span>
        </h2>
        
        <p className="text-lg sm:text-xl text-text-2 max-w-2xl mx-auto mb-10 leading-relaxed">
           Submit a demo lead, chat with the AI assistant, review the score in the Admin Portal, and see how the RM receives the handoff brief.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href={APP_URLS.clientWebsite} className="w-full sm:w-auto btn-primary px-8 py-4 text-base font-semibold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
            Try Demo Client Website <ArrowRight className="w-5 h-5" />
          </a>
          
          <div className="flex gap-2 w-full sm:w-auto justify-center">
            <a href={APP_URLS.adminPortal} className="inline-flex h-14 items-center justify-center rounded-full bg-white border border-border-subtle px-6 text-sm font-semibold text-text-1 transition-all hover:bg-slate-50">
              <Lock className="w-4 h-4 mr-2 text-text-2" /> Open Admin Portal
            </a>
            <a href={APP_URLS.rmPortal} className="inline-flex h-14 items-center justify-center rounded-full bg-white border border-border-subtle px-6 text-sm font-semibold text-text-1 transition-all hover:bg-slate-50">
              <Lock className="w-4 h-4 mr-2 text-text-2" /> Open RM Portal
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
