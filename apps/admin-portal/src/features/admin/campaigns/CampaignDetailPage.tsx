import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "../../../lib/routerCompat";
import { adminApi } from "../../../services/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Zap, Flame, ThermometerSnowflake, Activity } from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function CampaignDetailPage() {
  const { campaignId } = useParams();

  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => adminApi.getCampaigns(),
  });

  const { data: leadsData } = useQuery({
    queryKey: ["leads"],
    queryFn: () => adminApi.getLeads({}),
  });

  const campaign = campaignsData?.data?.find(c => c.id === campaignId);
  const leads = leadsData?.data || [];

  if (!campaign) {
    return <div className="p-8 text-center text-zinc-500">Loading campaign details...</div>;
  }

  const conversionRate = campaign.leadCount > 0 
    ? ((campaign.convertedCount / campaign.leadCount) * 100).toFixed(1) 
    : 0;

  const chartData = [
    { name: 'Hot', value: campaign.hotCount, fill: '#f97316' },
    { name: 'Warm', value: campaign.warmCount, fill: '#eab308' },
    { name: 'Cold', value: campaign.coldCount, fill: '#06b6d4' },
    { name: 'Converted', value: campaign.convertedCount, fill: '#10b981' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/campaigns" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{campaign.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Campaign source: <span className="capitalize">{campaign.source}</span></p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="dark:bg-[#111827] dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.leadCount}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-[#111827] dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{conversionRate}%</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-[#111827] dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{campaign.hotCount}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-[#111827] dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warm Leads</CardTitle>
            <Flame className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{campaign.warmCount}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-[#111827] dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cold Leads</CardTitle>
            <ThermometerSnowflake className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-500">{campaign.coldCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="dark:bg-[#111827] dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} className="fill-zinc-500 dark:fill-zinc-400" />
                  <YAxis tickLine={false} axisLine={false} className="fill-zinc-500 dark:fill-zinc-400" />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#18181b', color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#111827] dark:border-zinc-800 flex flex-col">
          <CardHeader>
            <CardTitle>Recent Leads from Campaign</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 5).map((l: any, i: number) => (
                  <TableRow key={l.id || i} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <TableCell className="font-medium">
                      <Link to={`/admin/leads/${l.id}`} className="hover:underline text-gray-900 dark:text-gray-200">
                        {l.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider dark:border-zinc-700">
                         {l.classification}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-zinc-500">
                      {l.createdAt ? format(new Date(l.createdAt), "MMM d") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={3} className="text-center text-zinc-500 h-24">No leads explicitly linked yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
