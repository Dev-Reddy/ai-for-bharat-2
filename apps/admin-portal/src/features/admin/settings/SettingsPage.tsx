import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Sparkles, BrainCircuit } from "lucide-react";
import { Link } from "../../../lib/routerCompat";

export default function SettingsPage() {
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
            Workspace
          </CardTitle>
          <CardDescription>
            General profile and workspace controls can live here as they are added.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
