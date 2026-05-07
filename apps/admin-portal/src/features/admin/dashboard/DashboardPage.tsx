import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, PhoneCall, Flame, ThermometerSun, Snowflake, UserCheck, CalendarClock, Target, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "../../../components/theme-provider";
import { useNavigate } from "../../../lib/routerCompat";

export default function DashboardPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "all_time">("all_time");
  const { theme } = useTheme();
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ["dashboard-overview", period],
    queryFn: () => adminApi.getAdminDashboardOverview(period),
  });

  if (!data?.data && isFetching) {
    return <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-10 w-32 rounded" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
         {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[350px] rounded-xl" />
        ))}
      </div>
    </div>;
  }

  const overview = data?.data?.overview || {} as any;
  const funnel = data?.data?.funnel || [];
  const languageStats = data?.data?.languageStats || [];
  const objectionStats = data?.data?.objectionStats || [];
  const scoreBreakdown = data?.data?.scoreBreakdown || [];
  const scoreDimensionAverages = data?.data?.scoreDimensionAverages || {};
  const rmLoad = data?.data?.rmLoad || [];
  const periodLabelMap: Record<typeof period, string> = {
    daily: "Period: Today",
    weekly: "Period: This Week",
    monthly: "Period: This Month",
    all_time: "Period: All Time",
  };

  const kpis = [
    { label: "Total Leads", value: overview.totalLeads, icon: Users, color: "text-gray-500", trend: "+12%", onClick: () => navigate("/admin/leads") },
    { label: "Conversations Completed", value: overview.conversationCompleted, icon: PhoneCall, color: "text-gray-500", trend: "+5%", onClick: () => navigate("/admin/conversations") },
    { label: "Hot Leads", value: overview.hot, icon: Flame, color: "text-orange-500", trend: "+2%", onClick: () => navigate("/admin/leads?classification=hot") },
    { label: "Warm Leads", value: overview.warm, icon: ThermometerSun, color: "text-emerald-500", trend: "-1%", onClick: () => navigate("/admin/leads?classification=warm") },
    { label: "Cold Leads", value: overview.cold, icon: Snowflake, color: "text-gray-500", trend: "0%", onClick: () => navigate("/admin/leads?classification=cold") },
    { label: "Assigned to RM", value: overview.assignedToRm, icon: UserCheck, color: "text-gray-500", trend: "+8%", onClick: () => navigate("/admin/leads?status=assigned_to_rm") },
    { label: "Follow Ups Ready", value: overview.followUpsScheduled, icon: CalendarClock, color: "text-gray-500", trend: "+15%", onClick: () => navigate("/admin/followups") },
    { label: "Converted", value: overview.converted, icon: Target, color: "text-emerald-600", trend: "+3%", onClick: () => navigate("/admin/leads/converted") },
  ];

  const classColors = {
    hot: "#f97316", // orange-500
    warm: "#10b981", // emerald-500
    cold: "#52525b"  // zinc-600
  };

  const pieData = [
    { name: 'Hot', value: overview.hot, fill: classColors.hot },
    { name: 'Warm', value: overview.warm, fill: classColors.warm },
    { name: 'Cold', value: overview.cold, fill: classColors.cold },
  ];

  const chartFill = theme === "dark" ? "#e4e4e7" : "#3f3f46"; // zinc-200 : zinc-700
  const axisColor = theme === "dark" ? "#a1a1aa" : "#71717a";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded shadow-md text-sm text-foreground">
          <p className="font-medium mb-1">{label || payload[0].name}</p>
          <p className="text-zinc-500">Count: <span className="font-semibold text-foreground">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500">Overview of your AI lead conversion system.</p>
        </div>
        <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue>{periodLabelMap[period]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Period: Today</SelectItem>
            <SelectItem value="weekly">Period: This Week</SelectItem>
            <SelectItem value="monthly">Period: This Month</SelectItem>
            <SelectItem value="all_time">Period: All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!data?.data ? (
        <div className="flex h-64 items-center justify-center border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">No data available for this period.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {kpis.map((kpi, i) => {
              const isPositive = kpi.trend.startsWith("+");
              return (
                 <Card 
                   key={i} 
                   className="shadow-sm cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                   onClick={kpi.onClick}
                 >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </CardHeader>
                  <CardContent>
                    {isFetching ? <Skeleton className="h-8 w-16 mt-1" /> : (
                      <div className="flex items-end justify-between mt-1">
                        <div className="text-2xl font-bold">{kpi.value || 0}</div>
                        <div className={`flex items-center text-xs ${isPositive ? 'text-emerald-500' : 'text-zinc-500'}`}>
                          {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {kpi.trend}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Lead Status Funnel</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isFetching ? (
                  <Skeleton className="w-full h-full rounded-md" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnel} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: axisColor}} width={140} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} />
                      <Bar dataKey="count" fill={chartFill} radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Lead Classification</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isFetching ? (
                  <Skeleton className="w-full h-full rounded-md" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={100}
                        paddingAngle={2}
                        label={{fill: axisColor, fontSize: 12}}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Language Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isFetching ? (
                  <Skeleton className="w-full h-full rounded-md" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={languageStats} margin={{ top: 20 }}>
                      <XAxis dataKey="language" axisLine={false} tickLine={false} tick={{fill: axisColor}} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} />
                      <Bar dataKey="count" fill={chartFill} radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Top Objections</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isFetching ? (
                  <Skeleton className="w-full h-full rounded-md" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={objectionStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="type" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: axisColor}} width={120} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} />
                      <Bar dataKey="count" fill={chartFill} radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreBreakdown}>
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: axisColor}} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill={chartFill} radius={[4, 4, 0, 0]} barSize={46} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Average Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border p-4 text-center">
                  <div className="text-2xl font-bold">{scoreDimensionAverages.interest ?? 0}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Interest</div>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <div className="text-2xl font-bold">{scoreDimensionAverages.readiness ?? 0}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Readiness</div>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <div className="text-2xl font-bold">{scoreDimensionAverages.network ?? 0}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Network</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">RM Load</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rmLoad.map((rm: any) => (
                <div key={rm.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <div className="font-medium">{rm.name}</div>
                    <div className="text-xs text-zinc-500">{rm.email}</div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>Assigned: <span className="font-semibold">{rm.assignedLeadCount}</span></div>
                    <div>Pending: <span className="font-semibold">{rm.pendingTaskCount}</span></div>
                    <div>Converted: <span className="font-semibold">{rm.convertedCount}</span></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
