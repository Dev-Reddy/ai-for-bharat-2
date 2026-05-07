import Link from "next/link";
import { APP_URLS } from "@/lib/app-urls";

export default function Footer() {
  return (
    <footer className="w-full bg-bg-primary py-12 border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8 border-b border-border-subtle pb-8">
        <div className="flex flex-col text-left">
          <Link href="/" className="font-display font-semibold text-xl tracking-tight flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-text-1 flex items-center justify-center">
              <span className="text-bg-primary font-bold text-xs leading-none select-none">L</span>
            </div>
            LeadOS
          </Link>
          <p className="text-sm font-medium text-text-1 max-w-xs mb-1">
            Multilingual AI Lead Conversion Platform
          </p>
          <p className="text-xs text-text-2 max-w-sm">
            Built for AI-powered lead qualification, RM handoff, and conversion analytics.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-text-2">
          <Link href="#product-preview" className="hover:text-text-1 transition-colors">Product</Link>
          <Link href="#cta" className="hover:text-text-1 transition-colors">Demo</Link>
          <Link href={APP_URLS.adminPortal} className="hover:text-text-1 transition-colors">Admin Portal</Link>
          <Link href={APP_URLS.rmPortal} className="hover:text-text-1 transition-colors">RM Portal</Link>
          <Link href="#architecture" className="hover:text-text-1 transition-colors">Architecture</Link>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-[10px] font-medium text-slate-400">© 2026 LeadOS. Built for high-intent lead conversion teams.</span>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span className="font-bold text-slate-600 tracking-tight text-[10px]">SYSTEMS OPERATIONAL</span>
        </div>
      </div>
    </footer>
  );
}
