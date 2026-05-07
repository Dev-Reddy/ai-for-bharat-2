import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Link, useNavigate } from "../../../lib/routerCompat";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Search, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { LeadClassification, LeadStatus, Lead } from "../../../types/admin.types";

export default function ConvertedLeadsPage() {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{key: keyof Lead | 'score', direction: 'asc'|'desc'}>({ key: 'createdAt', direction: 'desc' });
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => adminApi.getLeads({}),
  });

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case "converted": return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 shadow-none border-0 pt-0.5">Converted</Badge>;
      default: return <Badge variant="outline" className="dark:border-zinc-700">{status}</Badge>;
    }
  };

  const getClassificationBadge = (cls: LeadClassification) => {
    switch (cls) {
      case "hot": return <Badge className="bg-orange-500 hover:bg-orange-600 shadow-none border-0 pt-0.5">Hot</Badge>;
      case "warm": return <Badge className="bg-yellow-500 hover:bg-yellow-600 shadow-none border-0 pt-0.5">Warm</Badge>;
      case "cold": return <Badge className="bg-cyan-500 hover:bg-cyan-600 shadow-none border-0 pt-0.5">Cold</Badge>;
      default: return null;
    }
  };

  const leads = data?.data || [];

  const filteredAndSortedLeads = useMemo(() => {
    let result = leads.filter(l => l.status === "converted");

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.phone.includes(q) ||
        l.city?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Lead];
      let bVal: any = b[sortConfig.key as keyof Lead];
      
      if (sortConfig.key === 'score') {
        aVal = a.latestScore || 0;
        bVal = b.latestScore || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, sortConfig]);

  const handleSort = (key: keyof Lead | 'score') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-zinc-300 dark:text-zinc-700" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-zinc-900 dark:text-zinc-100" /> : <ArrowDown className="ml-2 h-4 w-4 text-zinc-900 dark:text-zinc-100" />;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-500">Converted Leads</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">View and manage all leads that have successfully converted.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-[#111827] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            placeholder="Search name, phone or city..."
            className="pl-8 bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#111827] overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50 h-10 border-b border-zinc-200 dark:border-zinc-800">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center">Lead <SortIcon column="name" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('preferredChannel')}>
                <div className="flex items-center">Channel <SortIcon column="preferredChannel" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center">Status <SortIcon column="status" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('score')}>
                <div className="flex items-center">Score <SortIcon column="score" /></div>
              </TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('createdAt')}>
                <div className="flex items-center">Converted on <SortIcon column="createdAt" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                   <span className="animate-pulse">Loading converted leads...</span>
                 </TableCell>
               </TableRow>
            ) : filteredAndSortedLeads.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                   No converted leads found.
                 </TableCell>
               </TableRow>
            ) : (
              filteredAndSortedLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                    navigate(`/admin/leads/${lead.id}`);
                  }}
                >
                  <TableCell>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{lead.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{lead.phone} • {lead.city || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="capitalize text-sm text-zinc-600 dark:text-zinc-400">
                    {lead.preferredChannel || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {getStatusBadge(lead.status)}
                      {getClassificationBadge(lead.classification)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{lead.latestScore}</div>
                  </TableCell>
                  <TableCell>
                    {lead.assignedRm ? (
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{lead.assignedRm.name}</span>
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                    {format(new Date(lead.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/leads/${lead.id}`} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-foreground h-7 gap-1 px-2.5 aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50">
                        View <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
