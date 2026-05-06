import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "../../../lib/routerCompat";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { LeadClassification } from "../../../types/admin.types";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, User, Clock, AlertTriangle, Lightbulb, ArrowLeft, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const SENTIMENTS = ["Interested", "Frustrated", "Neutral", "Hesitant", "Enthusiastic"];
const NAMES = ["Amit Sharma", "Rohit Verma", "Anjali Gupta", "Vikram Singh", "Priya Desai", "Kunal Patel", "Neha Redi", "Arjun Nair"];

export default function ConversationsPage() {
  const navigate = useNavigate();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 15 full mock conversations once
  const enhancedConversations = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => {
      const isAiFirst = Math.random() > 0.5;
      const numMessages = Math.floor(Math.random() * 10) + 4;
      const localMessages: Array<{
        role: string;
        content: string;
        timestamp: string;
      }> = [];
      let lastTime = new Date(Date.now() - 86400000 * Math.random()).getTime();

      for (let j = 0; j < numMessages; j++) {
        const isAssistant = j % 2 === (isAiFirst ? 0 : 1);
        lastTime += Math.floor(Math.random() * 60000) + 10000;
        localMessages.push({
          role: isAssistant ? "assistant" : "user",
          content: isAssistant ? "Hello! How can we assist you with LeadOS today?" : "I need more information about the commission structure.",
          timestamp: new Date(lastTime).toISOString()
        });
      }

      return {
        id: `conv_${i}`,
        leadId: `lead_${i}`,
        leadName: NAMES[i % NAMES.length],
        channel: i % 3 === 0 ? "voice" : "chat",
        language: "English",
        status: "completed",
        durationSeconds: Math.floor(Math.random() * 600) + 30,
        classification: ["hot", "warm", "cold"][i % 3] as LeadClassification,
        score: Math.floor(Math.random() * 50) + 40,
        startedAt: localMessages[0].timestamp,
        sentiment: SENTIMENTS[i % SENTIMENTS.length],
        messages: localMessages,
        aiSummary: "The lead was very interested in the onboarding process and requested more details.",
        keyObjection: "Found another broker with lower fees",
        nextAction: "Send competitive fee comparison"
      };
    }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, []);

  const [conversationsDetails, setConversationsDetails] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const details: Record<string, any[]> = {};
    enhancedConversations.forEach(c => {
      details[c.id] = c.messages;
    });
    setConversationsDetails(details);
  }, [enhancedConversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConvId, conversationsDetails]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedConvId) return;

    const newMessage = {
      role: 'assistant',
      content: chatMessage,
      timestamp: new Date().toISOString()
    };

    setConversationsDetails(prev => ({
      ...prev,
      [selectedConvId]: [...prev[selectedConvId], newMessage]
    }));
    setChatMessage("");
  };

  const getClassificationBadge = (cls: LeadClassification) => {
    switch (cls) {
      case "hot": return <Badge className="bg-orange-500 hover:bg-orange-600 shadow-none border-0 text-white">Hot</Badge>;
      case "warm": return <Badge className="bg-yellow-500 hover:bg-yellow-600 shadow-none border-0 text-white">Warm</Badge>;
      case "cold": return <Badge className="bg-cyan-500 hover:bg-cyan-600 shadow-none border-0 text-white">Cold</Badge>;
      default: return null;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "Interested":
      case "Enthusiastic":
      case "positive":
        return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">Positive</Badge>;
      case "Frustrated":
        return <Badge variant="outline" className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">Negative</Badge>;
      case "Hesitant":
        return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">Hesitant</Badge>;
      default:
        return <Badge variant="outline" className="bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800">Neutral</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const currentConv = enhancedConversations.find(c => c.id === selectedConvId);
  const currentMessages = selectedConvId ? conversationsDetails[selectedConvId] || [] : [];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col pt-2 pb-0 p-4 sm:p-6">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Conversations</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">View all AI conversations across leads.</p>
      </div>

      <div className="flex flex-1 overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#111827] shadow-sm">
        {/* Left pane: List */}
        <div className={`w-full md:w-1/3 flex-col border-r border-zinc-200 dark:border-zinc-800 md:max-w-[400px] ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent Chats ({enhancedConversations.length})</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {enhancedConversations.map((conv) => (
                <button 
                  key={conv.id} 
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`text-left p-4 border-b border-zinc-100 dark:border-zinc-800/50 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${selectedConvId === conv.id ? 'bg-zinc-50 dark:bg-zinc-800 border-l-4 border-l-gray-400' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{conv.leadName}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{format(new Date(conv.startedAt), "HH:mm")}</span>
                  </div>
                  <div className="flex gap-2 items-center mb-2">
                     {getClassificationBadge(conv.classification)}
                     {getSentimentBadge(conv.sentiment)}
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {conv.channel.toUpperCase()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {formatDuration(conv.durationSeconds)}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right pane: Detail */}
        <div className={`md:flex flex-1 flex-col bg-zinc-50/50 dark:bg-[#0B0F14] h-full relative ${selectedConvId ? 'flex' : 'hidden'}`}>
          {!currentConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <p>Select a conversation to view transcript</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827] flex justify-between items-center shrink-0 gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-zinc-500 hover:text-zinc-900" onClick={() => setSelectedConvId(null)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h3 
                      className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 cursor-pointer hover:underline" 
                      onClick={() => navigate(`/admin/leads/${currentConv.leadId}`)}
                    >
                      {currentConv.leadName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span className="uppercase">{currentConv.channel}</span>
                      <span>•</span>
                      <span>{currentConv.language}</span>
                      <span>•</span>
                      <span>Score: {currentConv.score}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/leads/${currentConv.leadId}`)}>
                    <User className="w-4 h-4 mr-2" /> View Lead
                  </Button>
                </div>
              </div>

              {/* Insights Banner */}
              <div className="bg-gray-50 dark:bg-[#111827] p-4 border-b border-zinc-200 dark:border-zinc-800 grid gap-4 lg:grid-cols-3 text-sm shrink-0">
                <div className="space-y-1">
                   <div className="text-gray-900 dark:text-gray-200 font-semibold flex items-center gap-1.5 break-words">
                     <Bot className="w-4 h-4 shrink-0" /> AI Summary
                   </div>
                   <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">{currentConv.aiSummary}</p>
                </div>
                <div className="space-y-1">
                   <div className="text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-1.5 break-words">
                     <AlertTriangle className="w-4 h-4 shrink-0" /> Key Objection
                   </div>
                   <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">{currentConv.keyObjection}</p>
                </div>
                <div className="space-y-1">
                   <div className="text-emerald-600 dark:text-emerald-500 font-semibold flex items-center gap-1.5 break-words">
                     <Lightbulb className="w-4 h-4 shrink-0" /> Next Action
                   </div>
                   <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">{currentConv.nextAction}</p>
                </div>
              </div>

              {/* Chat Thread Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6" ref={scrollRef}>
                <div className="space-y-6 max-w-3xl mx-auto">
                  {currentMessages.map((msg: any, i: number) => {
                    const isAi = msg.role === 'assistant';
                    return (
                      <div key={i} className={`flex flex-col ${isAi ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {isAi ? 'Admin/AI' : currentConv.leadName}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {format(new Date(msg.timestamp), "HH:mm")}
                          </span>
                        </div>
                        <div 
                          className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                            isAi 
                              ? 'bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white rounded-tr-sm' 
                              : 'bg-white dark:bg-[#1A2234] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-[#111827] border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
                  <Input 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 focus-visible:ring-gray-500"
                  />
                  <Button type="submit" disabled={!chatMessage.trim()} className="bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900   text-white">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
