import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { rmApi, type RMDashboardPeriod } from "../../services/rmApi";
import { useNavigate } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { rmAxisTickColor, rmChartPalette, rmLeadClassColors } from "../../theme/rmChartTheme";

const PERIOD_OPTIONS: { value: RMDashboardPeriod; label: string }[] = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This week" },
  { value: "monthly", label: "This month" },
  { value: "all_time", label: "All time" },
];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
        <p className="font-bold text-slate-800">{label || payload[0].name}</p>
        <p className="text-slate-500">
          Count: <span className="font-semibold text-slate-900">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
}

const StatCard = ({ label, value, color }: { label: string; value: string | number | undefined; color: string }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-sans min-w-0">
    <div className="flex flex-col">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 truncate">{label}</p>
      <p className={`text-2xl sm:text-3xl font-black tabular-nums truncate ${color}`}>{value ?? "—"}</p>
    </div>
  </div>
);

type DashboardHotLead = {
  id: string;
  name: string;
  mainObjection?: string;
  preferredLanguage: string;
};

export const RMDashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<RMDashboardPeriod>("all_time");

  const { data, isLoading } = useQuery({
    queryKey: ["rm-dash", period],
    queryFn: () => rmApi.getRMDashboardOverview(period),
  });

  const funnel = data?.funnel ?? [];
  const classificationBreakdown = data?.classificationBreakdown ?? [];
  const languageBreakdown = data?.languageBreakdown ?? [];
  const hotLeads = data?.hotLeads ?? [];
  const hasHotLeads = hotLeads.length > 0;
  const objectionBreakdown = (data?.objectionBreakdown ?? []).map((row: { type: string; count: number }) => ({
    type: row.type,
    count: row.count,
  }));

  const pieData = classificationBreakdown.map((entry: { name: string; value: number; key: string }) => ({
    name: entry.name,
    value: entry.value,
    fill: rmLeadClassColors[entry.key as keyof typeof rmLeadClassColors] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Your assigned leads and analytics.</p>
        </div>
        <select
          aria-label="Analytics time period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as RMDashboardPeriod)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 uppercase tracking-widest w-full sm:w-auto"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Period: {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse text-sm font-bold">Loading dashboard…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total leads" value={data?.overview.totalLeads} color="text-slate-800" />
            <StatCard label="Conversations done" value={data?.overview.conversationCompleted} color="text-slate-700" />
            <StatCard label="Hot leads" value={data?.overview.assignedHotLeads} color="text-red-600" />
            <StatCard label="Pending" value={data?.overview.pendingTasks} color="text-blue-600" />
            <StatCard label="Follow ups" value={data?.overview.followUpsDue} color="text-amber-600" />
            <StatCard label="Converted" value={data?.overview.convertedLeads} color="text-green-600" />
            <StatCard label="Cold (closed bucket)" value={data?.overview.closedLeads} color="text-slate-400" />
            <StatCard label="Avg score" value={`${data?.overview.averageLeadScore ?? 0}%`} color="text-indigo-600" />
          </div>

          <div className={`grid grid-cols-1 gap-8 ${hasHotLeads ? "lg:grid-cols-2" : ""}`}>
            {hasHotLeads && (
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sans">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Priority Hot Leads</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                  {hotLeads.map((lead: DashboardHotLead) => (
                    <div
                      key={lead.id}
                      className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {lead.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {lead.mainObjection ?? "No objection captured"} • {lead.preferredLanguage}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/rm/leads/$leadId", params: { leadId: lead.id } })}
                        className="shrink-0 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                      >
                        View Handoff
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sans">
              <div className="p-5 border-b border-slate-100 font-bold text-slate-800 uppercase text-xs tracking-widest bg-slate-50/50">
                Score Breakdown
              </div>
              <div className="p-5 grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-slate-500 uppercase tracking-widest">Interest</div>
                  <div className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
                    {data?.scoreDimensionAverages?.interest ?? 0}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-slate-500 uppercase tracking-widest">Readiness</div>
                  <div className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
                    {data?.scoreDimensionAverages?.readiness ?? 0}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-slate-500 uppercase tracking-widest">Network</div>
                  <div className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
                    {data?.scoreDimensionAverages?.network ?? 0}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4">Lead status funnel</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="label"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: rmAxisTickColor }}
                      width={130}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={26}>
                      {funnel.map((_: unknown, idx: number) => (
                        <Cell key={idx} fill={rmChartPalette[idx % rmChartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4">Lead classification</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={2}
                      label={{ fill: rmAxisTickColor, fontSize: 11 }}
                    >
                      {pieData.map((entry: { fill: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4">Language distribution</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={languageBreakdown} margin={{ top: 8 }}>
                    <XAxis dataKey="language" axisLine={false} tickLine={false} tick={{ fill: rmAxisTickColor, fontSize: 11 }} />
                    <YAxis hide />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                      {languageBreakdown.map((_: unknown, idx: number) => (
                        <Cell key={idx} fill={rmChartPalette[idx % rmChartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4">Top objections</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={objectionBreakdown} layout="vertical" margin={{ left: 4, right: 12 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="type"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: rmAxisTickColor }}
                      width={100}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                      {objectionBreakdown.map((_: unknown, idx: number) => (
                        <Cell key={idx} fill={rmChartPalette[idx % rmChartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
