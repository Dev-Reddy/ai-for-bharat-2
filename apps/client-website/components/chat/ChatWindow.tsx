'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Bot, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase";
import {
  endPublicChat,
  getPublicThreadMessages,
  sendPublicChatMessage,
} from "@/services/publicApi";
import { useLeadSessionStore } from "@/store/leadSessionStore";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  sentAt: string;
  metadata?: Record<string, unknown>;
};

function normalizeMessage(message: {
  id: string;
  senderType: string;
  messageText: string;
  sentAt: string;
  metadata?: Record<string, unknown>;
}) {
  return {
    id: message.id,
    role: message.senderType === "ai" ? "assistant" : "user",
    content: message.messageText,
    sentAt: message.sentAt,
    metadata: message.metadata ?? {},
  } satisfies ChatMessage;
}

export function ChatWindow() {
  const router = useRouter();
  const session = useLeadSessionStore((state) => state.session);
  const clearLead = useLeadSessionStore((state) => state.clearLead);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingThread, setIsLoadingThread] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [threadStatus, setThreadStatus] = useState<string>("active");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const chatThreadId = session?.chatThreadId ?? null;
  const lead = session?.lead ?? null;

  const applyIncomingMessage = (incoming: ChatMessage) => {
    setMessages((previous) => {
      const next = [...previous];
      const existingIndex = next.findIndex((item) => item.id === incoming.id);

      if (existingIndex >= 0) {
        next[existingIndex] = incoming;
      } else {
        next.push(incoming);
      }

      return next.sort(
        (a, b) =>
          new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
      );
    });
  };

  useEffect(() => {
    if (!lead || !chatThreadId) {
      router.replace("/");
      return;
    }

    let isActive = true;
    const supabase = getSupabaseClient();
    setIsLoadingThread(true);

    getPublicThreadMessages(chatThreadId)
      .then((result) => {
        if (!isActive) return;
        setThreadStatus(result.thread.status);
        setMessages(result.messages.map(normalizeMessage));
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingThread(false);
        }
      });

    const channel = supabase
      .channel(`public-thread-${chatThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${chatThreadId}`,
        },
        (payload) => {
          const row =
            payload.eventType === "DELETE"
              ? null
              : (payload.new as {
                  id: string;
                  sender_type: string;
                  message_text: string;
                  sent_at: string;
                  metadata?: Record<string, unknown>;
                });

          if (!row) {
            return;
          }

          applyIncomingMessage({
            id: row.id,
            role: row.sender_type === "ai" ? "assistant" : "user",
            content: row.message_text,
            sentAt: row.sent_at,
            metadata: row.metadata ?? {},
          });
        },
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [chatThreadId, lead, router]);

  const lastAssistantMessage = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === "assistant");
  }, [messages]);

  const isAssistantStreaming =
    Boolean(lastAssistantMessage?.metadata?.streaming) && threadStatus !== "completed";

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAssistantStreaming]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatThreadId || isSubmitting || isAssistantStreaming) {
      return;
    }

    const outgoing = inputValue.trim();
    setInputValue("");
    setIsSubmitting(true);

    try {
      const result = await sendPublicChatMessage(chatThreadId, outgoing);
      const refreshed = await getPublicThreadMessages(chatThreadId);
      setThreadStatus(refreshed.thread.status);
      setMessages(refreshed.messages.map(normalizeMessage));
      if (result.conversationComplete) {
        setThreadStatus("completed");
        setTimeout(() => {
          router.push("/thank-you");
        }, 1200);
      }
    } catch (_error) {
      setInputValue(outgoing);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleEndChat = async () => {
    if (!chatThreadId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await endPublicChat(chatThreadId);
      setThreadStatus("completed");
      router.push("/thank-you");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lead) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-gray-50 border-x border-gray-100 shadow-[0_0_50px_rgba(0,0,0,0.03)]">
      <header className="flex items-center px-6 py-4 bg-white border-b border-gray-100 shrink-0">
        <button
          onClick={() => {
            clearLead();
            router.push("/");
          }}
          className="p-2 mr-3 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          title="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center">
            Rupeezy Partner AI
            <BadgeCheck className="w-4 h-4 text-blue-500 ml-1.5" />
          </h1>
          <p className="text-xs text-green-600 flex items-center mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
            {threadStatus === "completed" ? "Conversation completed" : "Live chat"}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {isLoadingThread && (
          <div className="text-sm text-gray-500">Loading your chat history...</div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "flex max-w-[85%] sm:max-w-[75%]",
              msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm",
                msg.role === "assistant" ? "bg-white border border-gray-100 text-[#0ea5e9] mr-3" : "bg-[#0ea5e9] text-white ml-3"
              )}>
                {msg.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={cn(
                "px-5 py-3.5 rounded-[20px] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap",
                msg.role === "assistant"
                  ? "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                  : "bg-[#0f172a] text-white rounded-br-sm"
              )}>
                {msg.content || (msg.role === "assistant" ? "..." : "")}
              </div>
            </div>
          </div>
        ))}

        {(isAssistantStreaming || isSubmitting) && (
          <div className="flex justify-start">
            <div className="flex max-w-[85%] flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm bg-white border border-gray-100 text-[#0ea5e9] mr-3">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-5 py-4 rounded-[20px] bg-white border border-gray-100 rounded-bl-sm flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="relative flex items-end gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAssistantStreaming || isSubmitting || threadStatus === "completed"}
            placeholder={
              threadStatus === "completed"
                ? "Conversation completed"
                : isAssistantStreaming
                  ? "AI is responding..."
                  : "Type your message..."
            }
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-[15px] rounded-2xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent resize-none max-h-32 disabled:opacity-50 transition-shadow"
            rows={1}
            style={{ minHeight: "52px" }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!inputValue.trim() || isAssistantStreaming || isSubmitting || threadStatus === "completed"}
            className="absolute right-16 bottom-2 p-2 rounded-full text-white bg-[#0ea5e9] hover:bg-[#0284c7] disabled:bg-gray-300 disabled:text-gray-500 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
          <button
            onClick={() => void handleEndChat()}
            disabled={isSubmitting}
            className="min-w-[116px] h-[52px] rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            End chat
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[11px] text-gray-400">
            Rupeezy Partner AI can make mistakes. Verify important details before acting.
          </p>
        </div>
      </div>
    </div>
  );
}
