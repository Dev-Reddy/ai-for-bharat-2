import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Sparkles, BrainCircuit } from "lucide-react";
import { Link } from "../../../lib/routerCompat";
import { adminApi } from "../../../services/adminApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["portal-settings"],
    queryFn: adminApi.getSettings,
  });
  const [templates, setTemplates] = useState({
    websiteChatGreetingTemplate: "",
    websiteChatGreetingTemplateHi: "",
    whatsappFollowUpTemplate: "",
  });

  useEffect(() => {
    if (data?.data) {
      setTemplates({
        websiteChatGreetingTemplate: data.data.websiteChatGreetingTemplate ?? "",
        websiteChatGreetingTemplateHi: data.data.websiteChatGreetingTemplateHi ?? "",
        whatsappFollowUpTemplate: data.data.whatsappFollowUpTemplate ?? "",
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateSettings(templates),
    onSuccess: () => {
      toast.success("Message templates updated");
      queryClient.invalidateQueries({ queryKey: ["portal-settings"] });
    },
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          General workspace settings stay here. AI prompt configuration has been moved into dedicated sections for better visibility.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Analysis Contexts
            </CardTitle>
            <CardDescription>
              Manage the active transcript scoring prompt used by lead analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/analysis-contexts"
              className="inline-flex rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Open Analysis Contexts
            </Link>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <BrainCircuit className="h-4 w-4 text-cyan-500" />
              Knowledge Contexts
            </CardTitle>
            <CardDescription>
              Manage the active Mem0 extraction prompt used for uploaded knowledge docs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/knowledge-contexts"
              className="inline-flex rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Open Knowledge Contexts
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Settings className="h-4 w-4 text-zinc-500" />
            Message Templates
          </CardTitle>
          <CardDescription>
            Configure the website chat greeting and the WhatsApp first message used in follow-ups.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Website Chat Greeting</div>
            <Textarea value={templates.websiteChatGreetingTemplate} onChange={(event) => setTemplates((current) => ({ ...current, websiteChatGreetingTemplate: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Website Chat Greeting (Hindi / Hinglish)</div>
            <Textarea value={templates.websiteChatGreetingTemplateHi} onChange={(event) => setTemplates((current) => ({ ...current, websiteChatGreetingTemplateHi: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">WhatsApp Follow-up First Message</div>
            <Textarea value={templates.whatsappFollowUpTemplate} onChange={(event) => setTemplates((current) => ({ ...current, whatsappFollowUpTemplate: event.target.value }))} />
            <div className="text-xs text-zinc-500">Supported variables: {"{{firstName}}"}, {"{{leadName}}"}, {"{{recommendedNextAction}}"}, {"{{classification}}"}</div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Templates"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
