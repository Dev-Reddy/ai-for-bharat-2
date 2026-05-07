import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import { PromptContextManager } from "../shared/PromptContextManager";

const defaultAnalysisPrompt = `You are the transcript scoring engine for Rupeezy's AI partner lead conversion workflow.

Evaluate a completed chat or Vapi call transcript.
Score the lead on:
- interest level
- readiness to sign up
- network size

Classify the lead as hot, warm, or cold.
Return duration, detected language, topics covered, objections raised with status, recommended next action, RM handoff summary, and a short overall summary.

Use only transcript evidence and approved Rupeezy AP partner program context.`;

export default function AnalysisContextsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["analysis-system-contexts"],
    queryFn: adminApi.getAnalysisSystemContexts,
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Analysis Contexts</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage the active transcript scoring prompt used for chat and call analysis.
        </p>
      </div>

      <PromptContextManager
        description="Keep the prompt aligned to transcript scoring: interest, readiness, network size, classification, objections, and handoff summary."
        emptyMessage="No scoring contexts yet."
        activeLabel="Active Scoring Context"
        defaultPrompt={defaultAnalysisPrompt}
        contexts={data?.data ?? []}
        isLoading={isLoading}
        editingId={editingId}
        setEditingId={setEditingId}
        onCreate={adminApi.createAnalysisSystemContext}
        onUpdate={adminApi.updateAnalysisSystemContext}
        onActivate={adminApi.activateAnalysisSystemContext}
        invalidateKey="analysis-system-contexts"
        createLabel="Scoring Context"
        icon={<Sparkles className="h-4 w-4 text-amber-500" />}
      />
    </div>
  );
}
