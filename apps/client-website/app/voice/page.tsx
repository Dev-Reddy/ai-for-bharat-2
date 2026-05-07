'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock3, MessageSquareMore, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startPublicLeadChat } from "@/services/publicApi";
import { useLeadSessionStore } from "@/store/leadSessionStore";
import { getSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function VoicePage() {
  const router = useRouter();
  const session = useLeadSessionStore((state) => state.session);
  const setSession = useLeadSessionStore((state) => state.setSession);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const lead = session?.lead ?? null;

  useEffect(() => {
    if (!lead || !session?.callThreadId) {
      router.replace("/");
    }
  }, [lead, router, session?.callThreadId]);

  useEffect(() => {
    const callThreadId = session?.callThreadId;
    if (!callThreadId) return;

    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`call-thread-${callThreadId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "call_threads", filter: `id=eq.${callThreadId}` },
        (payload) => {
          try {
            const row: any = payload.new;
            const status = row?.status;
            const providerPayload = row?.provider_payload ?? {};
            const endedMessage = row?.last_error ?? providerPayload?.endedMessage ?? providerPayload?.ended_message ?? providerPayload?.ended_message_text;
            const endedReason = providerPayload?.endedReason ?? providerPayload?.ended_reason ?? row?.ended_reason;

            if (status === "failed" || status === "ended" || endedMessage) {
              const message = endedMessage ?? `Call failed: ${endedReason ?? status}`;
              toast.error(message);
            }
          } catch (e) {
            // ignore
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.callThreadId]);

  if (!lead || !session?.callThreadId) {
    return null;
  }

  const handleSwitchToChat = async () => {
    if (session.chatThreadId) {
      router.push("/chat");
      return;
    }

    setIsStartingChat(true);
    try {
      const result = await startPublicLeadChat(lead.id!);
      setSession({
        ...session,
        chatThreadId: result.chatThread.id,
        channelTopic: result.chatThread.channelTopic,
      });
      router.push("/chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1324] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.82))] p-8 shadow-[0_30px_80px_rgba(8,15,40,0.45)]">
        <button
          onClick={() => router.push("/")}
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/12 text-cyan-300 ring-1 ring-cyan-400/20">
          <PhoneCall className="h-10 w-10" />
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-cyan-200">
            <Clock3 className="h-3.5 w-3.5" />
            Queued For AI Call
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            We have placed your lead in the instant call queue.
          </h1>

          <p className="max-w-lg text-sm leading-7 text-slate-300">
            The AI voice agent will call <span className="font-medium text-white">{lead.phone}</span>
            {" "}in under 5 minutes when the provider picks up this queued request. Your
            preferred language is set to{" "}
            <span className="capitalize text-white">{lead.preferredLanguage ?? "english"}</span>.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <p className="font-medium text-white">What happens next</p>
            <p className="mt-2 leading-6 text-slate-300">
              The call request is already stored on the backend and the dispatcher will keep
              trying until the first outbound attempt goes out. You can stay on this page, or
              switch to chat immediately if you prefer text instead of waiting for the call.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleSwitchToChat}
            disabled={isStartingChat}
            className="h-12 flex-1 rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          >
            <MessageSquareMore className="mr-2 h-4 w-4" />
            {isStartingChat ? "Opening chat..." : "Switch to Chat Now"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/thank-you")}
            className="h-12 flex-1 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
          >
            I&apos;ll wait for the call
          </Button>
        </div>
      </div>
    </main>
  );
}
