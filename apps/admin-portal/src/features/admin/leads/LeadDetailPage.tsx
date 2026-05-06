import { useState } from "react";
import { useParams } from "../../../lib/routerCompat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, User, Phone, CheckCircle, CheckCircle2, 
  MessageSquare, Target, MapPin, Globe, Bot, AlertTriangle 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => adminApi.getLeadDetail(leadId!),
    enabled: !!leadId,
  });

  const assignRmMutation = useMutation({
    mutationFn: (rmId: string) => adminApi.assignRm(leadId!, rmId),
    onSuccess: () => {
      toast.success("RM assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: () => toast.error("Failed to assign RM")
  });

  const saveNoteMutation = useMutation({
    mutationFn: (newNote: string) => new Promise(resolve => setTimeout(() => resolve(newNote), 500)), // mock
    onSuccess: () => {
      toast.success("Note saved");
      setNote("");
    }
  });

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground animate-pulse">Loading CRM data...</div>;
  }

  if (error || !data?.data) {
    return <div className="p-6 text-center text-red-500">Error loading lead</div>;
  }

  const { lead, messages, score, rmTask, latestConversation } = data.data;

  // Derive conversation duration safely
  let convDurationSeconds = 0;
  if (messages && messages.length > 1) {
    const firstMsgInfo = new Date(messages[0].timestamp).getTime();
    const lastMsgInfo = new Date(messages[messages.length - 1].timestamp).getTime();
    convDurationSeconds = Math.floor((lastMsgInfo - firstMsgInfo) / 1000);
  } else if (latestConversation?.durationSeconds) {
    convDurationSeconds = latestConversation.durationSeconds;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 mx-auto pb-12 w-full">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-none mb-1">{lead.name}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-2 items-center">
            <span>ID: {lead.id}</span>
            <span className="hidden sm:inline">•</span>
            <span className="capitalize">{lead.status.replace(/_/g, ' ')}</span>
          </p>
        </div>
        {!lead.assignedRm && (
          <Button 
            className="ml-auto" 
            onClick={() => assignRmMutation.mutate("user_2")}
            disabled={assignRmMutation.isPending}
          >
            {assignRmMutation.isPending ? "Assigning..." : "Assign RM"}
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: CRM Context */}
        <div className="w-full lg:w-1/3 xl:w-1/4 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Profile Info</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span className="text-foreground">{lead.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-foreground">{lead.city || "Unknown City"}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Globe className="h-4 w-4 shrink-0" />
                <span className="text-foreground capitalize">{lead.preferredLanguage || "Unknown Language"}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Target className="h-4 w-4 shrink-0" />
                <span className="text-foreground">Source: {lead.campaign?.name || "Direct / Website"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-muted/20">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">AI Score Card</CardTitle>
                <Badge className={`uppercase text-[10px] ${lead.classification === 'hot' ? 'bg-orange-500 hover:bg-orange-600 border-none text-white' : lead.classification === 'warm' ? 'bg-yellow-500 hover:bg-yellow-600 border-none text-white' : 'bg-cyan-500 hover:bg-cyan-600 border-none text-white'}`}>
                  {lead.classification}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold tracking-tighter text-foreground">{score.totalScore}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 font-semibold">Total Match Score</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm border-t pt-4">
                <div className="bg-background rounded-md p-2 shadow-sm border border-border">
                  <div className="font-semibold text-foreground text-lg">{score.readinessScore}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Ready</div>
                </div>
                <div className="bg-background rounded-md p-2 shadow-sm border border-border">
                  <div className="font-semibold text-foreground text-lg">{score.engagementScore}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Active</div>
                </div>
                <div className="bg-background rounded-md p-2 shadow-sm border border-border">
                  <div className="font-semibold text-foreground text-lg">{score.fitScore}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Ideal</div>
                </div>
              </div>
            </CardContent>
          </Card>

           <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">RM Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Textarea 
                placeholder="Add private note..." 
                className="resize-none min-h-[100px] text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button 
                size="sm" 
                className="w-full" 
                disabled={!note.trim() || saveNoteMutation.isPending}
                onClick={() => saveNoteMutation.mutate(note)}
              >
                {saveNoteMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Content: Details */}
        <div className="flex-1 w-full min-w-0">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="mb-4 w-full h-auto flex flex-wrap justify-start">
              <TabsTrigger value="timeline" className="py-2">Timeline</TabsTrigger>
              <TabsTrigger value="conversations" className="py-2">Chat History</TabsTrigger>
              <TabsTrigger value="followups" className="py-2">Follow-ups</TabsTrigger>
              <TabsTrigger value="objections" className="py-2">AI Insights</TabsTrigger>
            </TabsList>
            
            {/* TIMELINE */}
            <TabsContent value="timeline" className="space-y-4">
              <Card className="shadow-sm border-none bg-transparent">
                <CardContent className="p-0 sm:p-2">
                  <div className="relative border-l-2 border-border ml-3 space-y-10 py-4">
                    
                    {rmTask && (
                      <div className="relative">
                        <span className="absolute -left-[14px] flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary ring-4 ring-background">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </span>
                        <div className="ml-6 space-y-1">
                          <p className="text-sm font-semibold text-foreground">Follow-up Task Pending</p>
                          <p className="text-xs text-muted-foreground">Assigned to RM. Action: {rmTask.recommendedAction}</p>
                        </div>
                      </div>
                    )}

                    {(messages?.length > 0 || latestConversation) && (
                      <div className="relative">
                        <span className="absolute -left-[14px] flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-emerald-500 ring-4 ring-background">
                          <Bot className="h-3 w-3 text-emerald-600" />
                        </span>
                        <div className="ml-6 space-y-1">
                          <p className="text-sm font-semibold text-foreground">AI Conversation Completed</p>
                          <p className="text-xs text-muted-foreground">
                            {convDurationSeconds > 0 && `Duration: ${Math.floor(convDurationSeconds / 60)}m ${convDurationSeconds % 60}s via ${lead.preferredChannel || 'chat'}`}
                            {convDurationSeconds <= 0 && `Conducted via ${lead.preferredChannel || 'chat'}`}
                          </p>
                          <div className="bg-muted p-3 mt-2 rounded border border-border text-sm text-foreground max-w-2xl">
                            <span className="font-medium text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">AI Interaction Highlight</span>
                            "{lead.latestSummary}"
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <span className="absolute -left-[14px] flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-muted-foreground ring-4 ring-background">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </span>
                      <div className="ml-6 space-y-1">
                        <p className="text-sm font-semibold text-foreground">Lead Created</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(lead.createdAt), "MMM d, yyyy 'at' h:mm a")} • Source: {lead.campaign?.name || "Website"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONVERSATIONS */}
            <TabsContent value="conversations">
               <Card className="shadow-sm">
                 <CardHeader className="border-b bg-muted/20 pb-4">
                   <div className="flex justify-between items-center">
                     <div>
                       <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Chat Transcript</CardTitle>
                       <CardDescription className="mt-1 text-xs">Full conversation history with the AI Assistant</CardDescription>
                     </div>
                     <Badge variant="outline" className="bg-background capitalize">{lead.preferredChannel || 'chat'}</Badge>
                   </div>
                 </CardHeader>
                 <CardContent className="p-0">
                   {messages && messages.length > 0 ? (
                    <div className="flex flex-col p-4 sm:p-6 space-y-5 bg-muted/10 h-[500px] overflow-y-auto">
                      {messages.map((msg: any, i: number) => {
                          const isAi = msg.role === 'assistant';
                          return (
                            <div key={i} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                              <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  {isAi ? 'AI Agent' : lead.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(msg.timestamp), "HH:mm")}
                                </span>
                              </div>
                              <div 
                                className={`px-4 py-2.5 rounded-2xl max-w-[90%] sm:max-w-[75%] md:max-w-[85%] text-sm shadow-sm ${
                                  isAi 
                                    ? 'bg-background border border-border text-foreground rounded-tl-sm' 
                                    : 'bg-primary text-primary-foreground rounded-tr-sm'
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          );
                      })}
                    </div>
                   ) : (
                     <div className="p-8 text-center text-muted-foreground text-sm">
                       No conversation history available for this lead.
                     </div>
                   )}
                 </CardContent>
               </Card>
            </TabsContent>

            {/* FOLLOW_UPS */}
            <TabsContent value="followups">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">RM Follow-up Task</CardTitle>
                </CardHeader>
                <CardContent>
                  {rmTask ? (
                    <div className="space-y-4">
                      <div className="flex gap-3 p-4 border border-border rounded-lg bg-muted/5">
                        <CheckCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <div className="font-semibold text-foreground text-sm">Next Action: {rmTask.recommendedAction}</div>
                          <Badge variant="outline" className="uppercase text-[9px] tracking-widest text-primary border-primary/20 mb-2">{rmTask.status}</Badge>
                          <div className="text-sm text-muted-foreground mt-2 border-t pt-3 border-border/50">
                            <span className="font-medium text-foreground block mb-2 text-xs uppercase tracking-wider">Suggested Message to Customer:</span>
                            <div className="bg-background border border-border p-3 rounded-md italic">"{rmTask.suggestedOpeningLine}"</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground">
                      No follow-ups required currently.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* OBJECTIONS */}
            <TabsContent value="objections" className="space-y-4">
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader className="bg-gray-50/50 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-gray-300">
                    <Bot className="w-4 h-4" /> AI Strategic Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                   <p className="text-sm leading-relaxed text-foreground mb-4">{lead.latestSummary}</p>
                   {lead.latestNextAction && (
                     <div className="text-sm font-medium border-l-2 border-gray-500 pl-3 bg-gray-50/20 dark:bg-gray-800/10 p-2 rounded-r">
                       <span className="text-gray-900 dark:text-gray-200 font-semibold mb-0.5 block uppercase tracking-wider text-[10px]">Optimal Next Step</span>
                       {lead.latestNextAction}
                     </div>
                   )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Detected Objections</CardTitle>
                   <CardDescription className="text-xs">Objections identified and handled by AI during the conversation</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                  {score?.objections?.length > 0 ? (
                    score.objections.map((obj: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-3 bg-background shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm text-foreground">{obj.type}</span>
                          <Badge variant="outline" className={`uppercase tracking-widest text-[9px] font-bold ${
                            obj.status === 'Handled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {obj.status}
                          </Badge>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-md text-sm border">
                          <span className="font-semibold block text-foreground mb-1 text-xs uppercase tracking-wider">What Lead Expressed:</span>
                          <span className="text-muted-foreground italic max-w-full block break-words">"{obj.leadStatement}"</span>
                        </div>
                        <div className="text-sm pl-3 border-l-2 border-primary ml-1.5 py-1">
                           <span className="font-semibold block text-primary mb-1 text-xs uppercase tracking-wider">How AI Responded:</span>
                           <span className="text-muted-foreground block max-w-full break-words">{obj.aiResponseSummary}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-8 text-center border border-dashed rounded">
                      No major objections detected during the conversation.
                    </div>
                  )}
                 </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
