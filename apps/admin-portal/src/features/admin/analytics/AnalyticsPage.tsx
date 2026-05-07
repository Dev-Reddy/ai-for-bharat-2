import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Bot, Flame, MessageSquareText, PhoneCall, ThermometerSun } from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { adminChartPalette, adminLeadClassColors } from "../../../theme/adminChartTheme";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "all_time">("all_time");

  const { data, isFetching } = useQuery({
    queryKey: ["analytics-overview", period],
    queryFn: () => adminApi.getAdminDashboardOverview(period),
  });

  const { data: rmData, isFetching: isRmFetching } = useQuery({
    queryKey: ["analytics-rm"],
    queryFn: adminApi.getRmPerformance,
  });

  const overview = data?.data;
  const rms = rmData?.data || [];
  const classificationData = overview?.classificationBreakdown || [];
  const languageData = overview?.languageStats || [];
  const objectionData = overview?.objectionStats || [];

  const topCards = overview
    ? [
        { label: "Analyzed Conversations", value: overview.overview.conversationCompleted, icon: Bot, tone: "text-blue-500" },
        { label: "Hot Leads", value: overview.overview.hot, icon: Flame, tone: "text-orange-500" },
        { label: "Warm Follow-ups", value: overview.overview.followUpsScheduled, icon: ThermometerSun, tone: "text-yellow-500" },
        { label: "Call Volume", value: overview.overview.callVolume, icon: PhoneCall, tone: "text-emerald-500" },
        { label: "Chat Volume", value: overview.overview.chatVolume, icon: MessageSquareText, tone: "text-cyan-500" },
        { label: "Assigned to RM", value: overview.overview.assignedToRm, icon: Activity, tone: "text-violet-500" },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Funnel visibility for conversation volume, qualification breakdown, language mix, objections, and RM handoff load.
          </p>
        </div>
        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Today</SelectItem>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <SelectItem value="all_time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isFetching
          ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-[112px] rounded-xl" />)
          : topCards.map((item) => (
              <Card key={item.label} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
                <CardContent className="p-5 flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{item.label}</p>
                    <div className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{item.value}</div>
                  </div>
                  <item.icon className={`h-5 w-5 ${item.tone}`} />
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
          <CardHeader>
            <CardTitle>Qualification Breakdown</CardTitle>
            <CardDescription>Hot, Warm, and Cold distribution from persisted transcript scores.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isFetching ? (
              <Skeleton className="h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classificationData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {classificationData.map((entry: any) => (
                      <Cell key={entry.key} fill={adminLeadClassColors[entry.key as keyof typeof adminLeadClassColors] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
          <CardHeader>
            <CardTitle>Conversation Funnel</CardTitle>
            <CardDescription>Lead flow from capture to analysis and RM handoff.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isFetching ? (
              <Skeleton className="h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview?.funnel ?? []} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {(overview?.funnel ?? []).map((_: any, idx: number) => (
                      <Cell key={idx} fill={adminChartPalette[idx % adminChartPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
          <CardHeader>
            <CardTitle>Language Mix</CardTitle>
            <CardDescription>Detected transcript language across analyzed conversations.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isFetching ? (
              <Skeleton className="h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="language" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {(languageData ?? []).map((_: any, idx: number) => (
                      <Cell key={idx} fill={adminChartPalette[idx % adminChartPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
          <CardHeader>
            <CardTitle>Objection Trends</CardTitle>
            <CardDescription>Most common objections raised by partner leads.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isFetching ? (
              <Skeleton className="h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={objectionData.slice(0, 6)} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="type" width={140} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {(objectionData.slice(0, 6) ?? []).map((_: any, idx: number) => (
                      <Cell key={idx} fill={adminChartPalette[idx % adminChartPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
        <CardHeader>
          <CardTitle>RM Performance</CardTitle>
          <CardDescription>Workload and conversion visibility for handoff execution.</CardDescription>
        </CardHeader>
        <CardContent>
          {isRmFetching ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-[116px] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rms.map((rm: any) => (
                <div key={rm.id} className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-[#0B0F14]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{rm.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{rm.email}</div>
                    </div>
                    <div className={`text-xs font-medium ${rm.isActive ? "text-emerald-500" : "text-zinc-400"}`}>
                      {rm.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-white p-3 dark:bg-[#111827]">
                      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{rm.assignedLeadCount}</div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Assigned</div>
                    </div>
                    <div className="rounded-lg bg-white p-3 dark:bg-[#111827]">
                      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{rm.pendingTaskCount}</div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pending</div>
                    </div>
                    <div className="rounded-lg bg-white p-3 dark:bg-[#111827]">
                      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{rm.convertedCount}</div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Converted</div>
                    </div>
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
