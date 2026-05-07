import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit } from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import { PromptContextManager } from "../shared/PromptContextManager";

const defaultKnowledgePrompt = `Extract stable Rupeezy partner-program knowledge as atomic factual memories.

Preserve named entities, benefits, support details, eligibility criteria, onboarding details, and objection-handling facts.
Write memories that are reusable during retrieval and avoid conversational filler.
Do not invent claims, numbers, approvals, or compliance statements that are not present in the source content.`;

export default function KnowledgeContextsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge-system-contexts"],
    queryFn: adminApi.getKnowledgeSystemContexts,
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Knowledge Contexts</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage the active Mem0 extraction prompt used when uploaded knowledge documents are synced into shared memory.
        </p>
      </div>

      <PromptContextManager
        description="Guide how Mem0 distills uploaded docs into reusable memories: preserve benefits, onboarding, objections, eligibility, and factual business context."
        emptyMessage="No knowledge contexts yet."
        activeLabel="Active Knowledge Context"
        defaultPrompt={defaultKnowledgePrompt}
        contexts={data?.data ?? []}
        isLoading={isLoading}
        editingId={editingId}
        setEditingId={setEditingId}
        onCreate={adminApi.createKnowledgeSystemContext}
        onUpdate={adminApi.updateKnowledgeSystemContext}
        onActivate={adminApi.activateKnowledgeSystemContext}
        invalidateKey="knowledge-system-contexts"
        createLabel="Knowledge Context"
        icon={<BrainCircuit className="h-4 w-4 text-cyan-500" />}
      />
    </div>
  );
}
