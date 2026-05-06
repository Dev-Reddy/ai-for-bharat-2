import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "all_time">("all_time");

  const { data: overviewData, isFetching: isOverviewFetching } = useQuery({
    queryKey: ["analytics-overview", period],
    queryFn: () => adminApi.getAdminDashboardOverview(period),
  });

  const { data: rmData, isFetching: isRmFetching } = useQuery({
    queryKey: ["analytics-rm"],
    queryFn: adminApi.getRmPerformance,
  });

  const { data: campaignData, isFetching: isCampaignFetching } = useQuery({
    queryKey: ["analytics-campaigns"],
    queryFn: adminApi.getCampaigns,
  });

  const overview = overviewData?.data;
  const rms = rmData?.data || [];
  const campaigns = campaignData?.data || [];

  const classColors = {
    hot: "#f97316", // orange-500
    warm: "#ca8a04", // yellow-600
    cold: "#06b6d4"  // cyan-500
  };

  const pieData = overview ? [
    { name: 'Hot', value: overview.overview.hot, fill: classColors.hot },
    { name: 'Warm', value: overview.overview.warm, fill: classColors.warm },
    { name: 'Cold', value: overview.overview.cold, fill: classColors.cold },
  ] : [];

  const isDark = document.documentElement.classList.contains('dark');
  const barColor = isDark ? "#A1A1AA" : "#3f3f46"; // zinc-400 / zinc-700
  const axisColor = isDark ? "#71717A" : "#A1A1AA"; // zinc-500 / zinc-400

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Detailed performance insights across all channels.</p>
        </div>
        <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Today</SelectItem>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <SelectItem value="all_time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Classification Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isOverviewFetching ? (
              <Skeleton className="w-full h-full rounded-md" />
            ) : overview && (
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
                    label
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#fff', borderColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#F3F4F6' : '#111827' }}
                  />
                  <Legend 
                    wrapperStyle={{ color: isDark ? '#D1D5DB' : '#374151' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Lead Stages</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isOverviewFetching ? (
              <Skeleton className="w-full h-full rounded-md" />
            ) : overview && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.funnel}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: axisColor}} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                    contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#fff', borderColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#F3F4F6' : '#111827' }}
                  />
                  <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">RM Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-600 dark:text-zinc-400">RM Name</TableHead>
                  <TableHead className="text-center text-zinc-600 dark:text-zinc-400">Active</TableHead>
                  <TableHead className="text-right text-zinc-600 dark:text-zinc-400">Assigned Leads</TableHead>
                  <TableHead className="text-right text-zinc-600 dark:text-zinc-400">Pending Tasks</TableHead>
                  <TableHead className="text-right text-zinc-600 dark:text-zinc-400">Converted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isRmFetching ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-zinc-200 dark:border-zinc-800/50">
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell align="center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : rms.filter((rm: any) => rm.role === 'rm').map((rm: any) => (
                  <TableRow key={rm.id} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">{rm.name}</TableCell>
                    <TableCell className="text-center">
                      {rm.isActive ? <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-none shadow-none">Active</Badge> : <Badge variant="secondary" className="border-none shadow-none bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{rm.assignedLeadCount}</TableCell>
                    <TableCell className="text-right text-orange-600 dark:text-orange-400 font-medium">{rm.pendingTaskCount}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">{rm.convertedCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-600 dark:text-zinc-400">Campaign</TableHead>
                  <TableHead className="text-zinc-600 dark:text-zinc-400">Source</TableHead>
                  <TableHead className="text-right text-zinc-600 dark:text-zinc-400">Total</TableHead>
                  <TableHead className="text-right text-zinc-600 dark:text-zinc-400">Hot</TableHead>
                  <TableHead className="text-right text-zinc-600 dark:text-zinc-400">Warm</TableHead>
                  <TableHead className="text-right text-zinc-600 dark:text-zinc-400">Cold</TableHead>
                  <TableHead className="text-right text-zinc-600 dark:text-zinc-400">Converted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCampaignFetching ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-zinc-200 dark:border-zinc-800/50">
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : campaigns.map((camp: any) => (
                  <TableRow key={camp.id} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">{camp.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize border-zinc-200 dark:border-zinc-700">{camp.source}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-zinc-900 dark:text-zinc-100">{camp.leadCount}</TableCell>
                    <TableCell className="text-right text-orange-500">{camp.hotCount}</TableCell>
                    <TableCell className="text-right text-yellow-500">{camp.warmCount}</TableCell>
                    <TableCell className="text-right text-cyan-500">{camp.coldCount}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{camp.convertedCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
