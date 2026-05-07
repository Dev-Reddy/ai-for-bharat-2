import { useMemo } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, FileText } from "lucide-react";
import type { AnalysisSystemContext, KnowledgeSystemContext } from "../../../types/admin.types";

export const promptContextSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  promptTemplate: z.string().min(40, "Prompt should be descriptive"),
});

type ContextLike = AnalysisSystemContext | KnowledgeSystemContext;

export function PromptContextManager({
  description,
  emptyMessage,
  activeLabel,
  defaultPrompt,
  contexts,
  isLoading,
  editingId,
  setEditingId,
  onCreate,
  onUpdate,
  onActivate,
  invalidateKey,
  createLabel,
  icon,
}: {
  description: string;
  emptyMessage: string;
  activeLabel: string;
  defaultPrompt: string;
  contexts: ContextLike[];
  isLoading: boolean;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  onCreate: (payload: z.infer<typeof promptContextSchema>) => Promise<unknown>;
  onUpdate: (id: string, payload: z.infer<typeof promptContextSchema>) => Promise<unknown>;
  onActivate: (id: string) => Promise<unknown>;
  invalidateKey: string;
  createLabel: string;
  icon: ReactNode;
}) {
  const queryClient = useQueryClient();
  const activeContext = useMemo(
    () => contexts.find((context) => context.isActive) ?? null,
    [contexts],
  );

  const createMutation = useMutation({
    mutationFn: onCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      reset({
        name: "",
        description: "",
        promptTemplate: defaultPrompt,
      });
      toast.success(`${createLabel} saved`);
    },
    onError: () => toast.error(`Failed to save ${createLabel.toLowerCase()}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: z.infer<typeof promptContextSchema> }) => onUpdate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      setEditingId(null);
      reset({
        name: "",
        description: "",
        promptTemplate: defaultPrompt,
      });
      toast.success(`${createLabel} updated`);
    },
    onError: () => toast.error(`Failed to update ${createLabel.toLowerCase()}`),
  });

  const activateMutation = useMutation({
    mutationFn: onActivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      toast.success(`Active ${createLabel.toLowerCase()} changed`);
    },
    onError: () => toast.error(`Failed to activate ${createLabel.toLowerCase()}`),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(promptContextSchema),
    defaultValues: {
      name: "",
      description: "",
      promptTemplate: defaultPrompt,
    },
  });

  const onSubmit = (values: z.infer<typeof promptContextSchema>) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: values });
      return;
    }
    createMutation.mutate(values);
  };

  const startEdit = (context: ContextLike) => {
    setEditingId(context.id);
    reset({
      name: context.name,
      description: context.description ?? "",
      promptTemplate: context.promptTemplate,
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/60">
          <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            {icon}
            {editingId ? `Edit ${createLabel}` : `Create ${createLabel}`}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label>Prompt Template</Label>
              <Textarea
                {...register("promptTemplate")}
                className="min-h-[320px] bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 font-mono text-sm"
              />
              {errors.promptTemplate && <p className="text-xs text-red-500">{errors.promptTemplate.message as string}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId
                  ? updateMutation.isPending ? "Updating..." : `Update ${createLabel}`
                  : createMutation.isPending ? "Saving..." : `Save ${createLabel}`}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    reset({
                      name: "",
                      description: "",
                      promptTemplate: defaultPrompt,
                    });
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/60">
          <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <FileText className="h-4 w-4 text-blue-500" />
            Available Contexts
          </CardTitle>
          <CardDescription>
            Exactly one context can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {activeContext && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">{activeLabel}</span>
              </div>
              <div className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">{activeContext.name}</div>
              {activeContext.description && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{activeContext.description}</p>
              )}
            </div>
          )}

          <Separator />

          {isLoading ? (
            <div className="text-sm text-zinc-500 animate-pulse">Loading contexts...</div>
          ) : contexts.length === 0 ? (
            <div className="text-sm text-zinc-500">{emptyMessage}</div>
          ) : (
            <div className="space-y-3">
              {contexts.map((context) => (
                <div
                  key={context.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-[#0B0F14]"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{context.name}</h3>
                      {context.isActive && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-none shadow-none">Active</Badge>
                      )}
                    </div>
                    {context.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{context.description}</p>
                    )}
                    <p className="line-clamp-4 text-xs text-zinc-500 dark:text-zinc-500 whitespace-pre-wrap">
                      {context.promptTemplate}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(context)}>
                      Edit
                    </Button>
                    {!context.isActive && (
                      <Button
                        size="sm"
                        onClick={() => activateMutation.mutate(context.id)}
                        disabled={activateMutation.isPending}
                      >
                        Use This Context
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
