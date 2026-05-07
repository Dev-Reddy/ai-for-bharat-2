import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Clock, MessageSquare, PhoneCall, User } from "lucide-react";
import { useNavigate } from "../../../lib/routerCompat";
import { adminApi } from "../../../services/adminApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

function getClassificationBadge(classification: string) {
  if (classification === "hot") {
    return <Badge className="bg-orange-500 hover:bg-orange-500 text-white border-none">Hot</Badge>;
  }
  if (classification === "warm") {
    return <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white border-none">Warm</Badge>;
  }
  return <Badge className="bg-cyan-500 hover:bg-cyan-500 text-white border-none">Cold</Badge>;
}

export default function ConversationsPage() {
  const navigate = useNavigate();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => adminApi.getConversations({ page: 1, pageSize: 100, sortBy: "startedAt", sortDirection: "desc" }),
  });

  const conversations = data?.data ?? [];
  const selectedId = selectedConversationId ?? conversations[0]?.id ?? null;

  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ["conversation-detail", selectedId],
    queryFn: () => adminApi.getConversationDetail(selectedId!),
    enabled: !!selectedId,
  });

  const current = detailData?.data;
  const transcriptMessages = useMemo(() => {
    if (!current) return [];
    if (current.messages?.length) return current.messages;
    if (current.transcript) {
      return String(current.transcript)
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [speaker, ...rest] = line.split(":");
          return {
            role: speaker.toLowerCase().includes("ai") ? "assistant" : "user",
            content: rest.join(":").trim(),
            timestamp: current.startedAt,
          };
        });
    }
    return [];
  }, [current]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col p-4 sm:p-6">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Conversations</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Real transcript history across chat and Vapi calls.</p>
      </div>

      <div className="flex flex-1 overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#111827] shadow-sm">
        <div className={`w-full md:w-1/3 flex-col border-r border-zinc-200 dark:border-zinc-800 md:max-w-[380px] ${selectedId ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Transcript Records ({conversations.length})</h2>
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}
              </div>
            ) : (
              <div className="flex flex-col">
                {conversations.map((conversation: any) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`text-left p-4 border-b border-zinc-100 dark:border-zinc-800/50 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                      selectedId === conversation.id ? "bg-zinc-50 dark:bg-zinc-800 border-l-4 border-l-gray-400" : "border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{conversation.leadName}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{format(new Date(conversation.startedAt), "HH:mm")}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {getClassificationBadge(conversation.classification)}
                      <Badge variant="outline" className="uppercase">{conversation.channel}</Badge>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        {conversation.channel === "voice" ? <PhoneCall className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        {conversation.language}
                      </span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {conversation.durationSeconds || 0}s</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className={`md:flex flex-1 flex-col bg-zinc-50/50 dark:bg-[#0B0F14] ${selectedId ? "flex" : "hidden"}`}>
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              Select a conversation to inspect transcript details.
            </div>
          ) : isDetailLoading || !current ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-[420px] rounded-xl" />
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827] flex justify-between items-center gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setSelectedConversationId(null)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{current.leadName}</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span className="uppercase">{current.channel}</span>
                      <span>•</span>
                      <span>{current.language}</span>
                      <span>•</span>
                      <span>Score: {current.score}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/admin/leads/${current.leadId}`)}>
                  <User className="w-4 h-4 mr-2" /> View Lead
                </Button>
              </div>

              <div className="bg-gray-50 dark:bg-[#111827] p-4 border-b border-zinc-200 dark:border-zinc-800 grid gap-4 lg:grid-cols-2 text-sm shrink-0">
                <div className="space-y-1">
                  <div className="text-amber-600 dark:text-amber-500 font-semibold">Key Objection</div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">{current.keyObjection || "No objection captured"}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-emerald-600 dark:text-emerald-500 font-semibold">Next Action</div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">{current.nextAction || "Review lead manually"}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-6 max-w-3xl mx-auto">
                  {transcriptMessages.length ? transcriptMessages.map((message: any, index: number) => {
                    const isAssistant = message.role === "assistant";
                    return (
                      <div key={`${message.timestamp}-${index}`} className={`flex flex-col ${isAssistant ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {isAssistant ? "AI Agent" : current.leadName}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {format(new Date(message.timestamp), "HH:mm")}
                          </span>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                          isAssistant
                            ? "bg-gray-900 border border-gray-800 dark:bg-white dark:text-gray-900 text-white rounded-tr-sm"
                            : "bg-white dark:bg-[#1A2234] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm"
                        }`}>
                          {message.content}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-sm text-zinc-500">No transcript entries found.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
