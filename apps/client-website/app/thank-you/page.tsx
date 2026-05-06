'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLeadSessionStore } from "@/store/leadSessionStore";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThankYouPage() {
  const router = useRouter();
  const session = useLeadSessionStore(state => state.session);
  const lead = session?.lead ?? null;

  useEffect(() => {
    if (!lead) {
      router.replace("/");
    }
  }, [lead, router]);

  if (!lead) return null;

  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-10 md:p-14 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 max-w-lg w-full text-center hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-shadow">
        <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-bold text-[#0f172a] mb-4 tracking-tight">
          Thank you, {lead.name.split(" ")[0]}!
        </h1>
        
        <p className="text-[#475569] text-lg leading-relaxed mb-8">
          Your profile is being reviewed. We will follow up with you shortly
          {lead.whatsappConsent ? " via WhatsApp " : " via email "}
          with the next steps.
        </p>

        <div className="pt-8 border-t border-gray-100">
          <Button 
            onClick={() => router.push("/")}
            className="w-full h-12 text-base font-semibold rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white transition-all shadow-md hover:shadow-lg"
          >
            Return to Homepage
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </main>
  );
}
