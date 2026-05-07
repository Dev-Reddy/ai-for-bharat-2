'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LeadForm } from "@/components/form/LeadForm";
import { createPublicLead } from "@/services/publicApi";
import { useLeadSessionStore } from "@/store/leadSessionStore";
import { toast } from "sonner";
import { LeadFormValues } from "@/components/form/lead-schema";

export function LeadFormSection() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setSession = useLeadSessionStore((state) => state.setSession);

  const handleSubmit = async (data: LeadFormValues) => {
    setIsLoading(true);
    try {
      const normalizedData = {
        ...data,
        preferredLanguage:
          data.preferredLanguage === "other"
            ? data.preferredLanguageOther?.trim() || "other"
            : data.preferredLanguage,
      };
      const result = await createPublicLead(normalizedData as Parameters<typeof createPublicLead>[0]);
      setSession({
        lead: {
          id: result.lead.id,
          name: result.lead.name,
          phone: result.lead.phone,
          phoneE164: result.lead.phoneE164,
          countryIso: result.lead.countryIso,
          countryCode: result.lead.countryCode,
          mobileNumber: result.lead.mobileNumberRaw,
          email: result.lead.email ?? undefined,
          address: result.lead.address ?? undefined,
          preferredLanguage: normalizedData.preferredLanguage ?? result.lead.preferredLanguage ?? undefined,
          preferredContactMethod: result.lead.preferredContactMethod,
        },
        chatThreadId: result.chatThread?.id ?? null,
        callThreadId: result.callThread?.id ?? null,
        channelTopic: result.chatThread?.channelTopic ?? null,
      });
      toast.success("Lead created successfully.");

      if (result.callThread) {
        // Don't navigate to the `/voice` page (server function returns 500).
        // Instead show a toast confirming we'll reach out for the call.
        toast.success("Thanks — we will reach out to you shortly to set up the call.");
      } else {
        router.push(`/chat/${result.chatThread?.id}`);
      }
    } catch (error) {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="lead-form" className="py-24 bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 p-6 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] mb-3">
              Request Partner Access
            </h2>
            <p className="text-[16px] text-[#475569]">
              Fill out the form below to start our interactive demo.
            </p>
          </div>
          
          <LeadForm onSubmitSuccess={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
}
