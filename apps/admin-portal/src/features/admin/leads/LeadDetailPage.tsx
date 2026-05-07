import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "../../../lib/routerCompat";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Bot, MessageCircle, Phone, PhoneCall, RefreshCcw, UserRound } from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getClassBadgeTone(classification: string) {
  if (classification === "hot") return "bg-orange-500 hover:bg-orange-500 text-white";
  if (classification === "warm") return "bg-yellow-500 hover:bg-yellow-500 text-white";
  return "bg-cyan-500 hover:bg-cyan-500 text-white";
}

export default function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const queryClient = useQueryClient();

  const { data: usersResp } = useQuery({
    queryKey: ["users"],
    queryFn: () => adminApi.getUsers(),
  });
  const rms = (usersResp?.data ?? []).filter((u: any) => u.role === "rm");

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedRmId, setSelectedRmId] = useState<string>("");

  const assignMutation = useMutation({
    mutationFn: ({ leadId, rmId }: { leadId: string; rmId: string }) => adminApi.assignRm(leadId, rmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsAssignOpen(false);
      setSelectedRmId("");
      toast.success("RM assigned successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to assign RM");
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => adminApi.getLeadDetail(leadId!),
    enabled: !!leadId,
  });

  const runAnalysisMutation = useMutation({
    mutationFn: () => adminApi.runLeadAnalysis(leadId!),
    onSuccess: () => {
      toast.success("Transcript analysis rerun");
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
    },
    onError: () => toast.error("Failed to rerun analysis"),
  });

  const scheduleCallMutation = useMutation({
    mutationFn: () => adminApi.scheduleLeadCall(leadId!),
    onSuccess: () => {
      toast.success("Call scheduled");
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    },
    onError: () => toast.error("Failed to schedule call"),
  });

  const followUpMutation = useMutation({
    mutationFn: async (followUpId: string) => {
      const response = await adminApi.updateFollowUpStatus(followUpId, "opened");
      return response;
    },
    onSuccess: (response) => {
      const link = response?.data?.waMeLink;
      if (link) {
        window.open(link, "_blank", "noopener,noreferrer");
      }
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    },
    onError: () => toast.error("Failed to open WhatsApp link"),
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-zinc-500 animate-pulse">Loading lead context...</div>;
  }

  const payload = data?.data;
  if (!payload) {
    return <div className="p-6 text-sm text-red-500">Unable to load lead.</div>;
  }

  const { lead, latestConversation, messages, score, rmTask, followUp, latestTranscriptSource } = payload;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{lead.name}</h1>
              <Badge className={getClassBadgeTone(lead.classification)}>{lead.classification.toUpperCase()}</Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {lead.phone} • {lead.preferredLanguage || "unknown language"} • {lead.preferredChannel || "chat"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => runAnalysisMutation.mutate()} disabled={runAnalysisMutation.isPending}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {runAnalysisMutation.isPending ? "Running..." : "Analyze Again"}
          </Button>
          {lead.canStartCall ? (
          <Button variant="outline" onClick={() => scheduleCallMutation.mutate()} disabled={scheduleCallMutation.isPending}>
            <PhoneCall className="mr-2 h-4 w-4" />
            {scheduleCallMutation.isPending ? "Calling..." : "Call now"}
          </Button>
          ) : null}
          {(followUp?.id && followUp?.waMeLink) || lead.leadWaMeLink ? (
            <Button onClick={() => followUp?.id ? followUpMutation.mutate(followUp.id) : window.open(lead.leadWaMeLink!, "_blank", "noopener,noreferrer")} disabled={followUpMutation.isPending}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Open WhatsApp
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              setSelectedRmId(lead.assignedRm?.id ?? "");
              setIsAssignOpen(true);
            }}
            disabled={assignMutation.isPending}
          >
            <UserRound className="mr-2 h-4 w-4" />
            {assignMutation.isPending ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </div>

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">Assign to RM</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">Select a Relationship Manager to assign this lead to.</DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <Label className="text-zinc-700 dark:text-zinc-300">RM</Label>
            <Select value={selectedRmId} onValueChange={(v) => setSelectedRmId(v)}>
              <SelectTrigger className="w-full bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800">
                <SelectValue>{rms.find((r: any) => r.id === selectedRmId)?.name ?? "Choose RM"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {rms.length === 0 ? (
                  <SelectItem value="">No RMs available</SelectItem>
                ) : (
                  rms.map((rm: any) => (
                    <SelectItem key={rm.id} value={rm.id}>{rm.name} {rm.email ? `(${rm.email})` : ''}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAssignOpen(false); setSelectedRmId(""); }}>
              Cancel
            </Button>
            <Button disabled={assignMutation.isPending || !selectedRmId} onClick={() => assignMutation.mutate({ leadId: leadId!, rmId: selectedRmId })}>
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
            <CardHeader>
              <CardTitle>Lead Analysis</CardTitle>
              <CardDescription>
                {latestTranscriptSource === "call_thread" ? "Voice call transcript" : "Chat transcript"} analyzed for lead qualification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Detected Language</div>
                  <div className="mt-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">{score?.detectedLanguage || lead.preferredLanguage || "unknown"}</div>
                </div>
                <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Next Action</div>
                  <div className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">{score?.recommendedNextAction || lead.latestNextAction || "Review lead manually"}</div>
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">{score?.reason || "Analysis pending."}</div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
            <CardHeader>
              <CardTitle>Conversation Transcript</CardTitle>
              <CardDescription>
                {messages?.length ? `${messages.length} messages captured` : "No message transcript available"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[520px] space-y-4 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-[#0B0F14]">
                {messages?.length ? messages.map((message: any) => (
                  <div key={message.id} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      message.role === "assistant"
                        ? "bg-white text-zinc-900 border border-zinc-200 dark:bg-[#111827] dark:text-zinc-100 dark:border-zinc-800"
                        : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    }`}>
                      <div className="mb-1 text-[10px] uppercase tracking-widest opacity-60">
                        {message.role === "assistant" ? "AI Agent" : lead.name}
                      </div>
                      {message.content}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-zinc-500">No transcript messages available.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
            <CardHeader>
              <CardTitle>Scorecard</CardTitle>
              <CardDescription>Scoring on interest, readiness, and network fit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-zinc-900 p-5 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <div className="text-xs uppercase tracking-widest opacity-70">Total Score</div>
                <div className="mt-2 text-5xl font-semibold tracking-tight">{score?.totalScore ?? lead.latestScore ?? 0}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-200 p-3 text-center dark:border-zinc-800">
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{score?.interestLevelScore ?? lead.latestScoreBreakdown?.interestLevelScore ?? 0}</div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Interest</div>
                </div>
                <div className="rounded-xl border border-zinc-200 p-3 text-center dark:border-zinc-800">
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{score?.readinessToSignupScore ?? lead.latestScoreBreakdown?.readinessToSignupScore ?? 0}</div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Readiness</div>
                </div>
                <div className="rounded-xl border border-zinc-200 p-3 text-center dark:border-zinc-800">
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{score?.networkSizeScore ?? lead.latestScoreBreakdown?.networkSizeScore ?? 0}</div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Network</div>
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">{score?.reason || "Analysis pending."}</div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
            <CardHeader>
              <CardTitle>Handoff Context</CardTitle>
              <CardDescription>What the RM should see before continuing the conversation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-xs uppercase tracking-widest text-zinc-500">RM Opening Line</div>
                <div className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">
                  {rmTask?.suggestedOpeningLine || score?.suggestedOpeningLine || "Continue naturally from the AI summary."}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-xs uppercase tracking-widest text-zinc-500">Recommended Action</div>
                <div className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">
                  {rmTask?.recommendedAction || score?.recommendedNextAction || "Review transcript and decide next step."}
                </div>
              </div>
              {score?.objections?.length ? (
                <div className="space-y-3">
                  {score.objections.map((objection: any, index: number) => (
                    <div key={`${objection.type}-${index}`} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{objection.type}</div>
                        <Badge variant="outline">{objection.status}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{objection.leadStatement}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-zinc-500">No objection details captured.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
            <CardHeader>
              <CardTitle>Lead Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300"><Phone className="h-4 w-4" /> {lead.phone}</div>
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300"><UserRound className="h-4 w-4" /> {lead.city || "Unknown city"}</div>
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300"><Bot className="h-4 w-4" /> {lead.preferredChannel || "chat"}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Created {format(new Date(lead.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
