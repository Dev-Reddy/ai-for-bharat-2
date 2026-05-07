import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "../../../lib/routerCompat";
import { format, formatDistanceToNow } from "date-fns";
import { MessageCircle, ExternalLink, Check, ArrowUpDown, ArrowUp, ArrowDown, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export default function FollowUpsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>({ key: 'createdAt', direction: 'desc' });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["followups", statusFilter, classificationFilter, sortConfig, page],
    queryFn: () => adminApi.getFollowUps({
      page,
      pageSize: 20,
      status: statusFilter,
      classification: classificationFilter,
      sortBy: sortConfig.key,
      sortDirection: sortConfig.direction,
    }),
  });

  const syncMutation = useMutation({
    mutationFn: adminApi.syncFollowUps,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      setLastUpdated(new Date());
      toast.success("Pipeline synchronized");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => adminApi.updateFollowUpStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      toast.success("Follow-up status updated");
    }
  });

  const followups = (data?.data || []).map((f: any) => ({
    ...f,
    historyCount: 1,
    lastActionTime: f.updatedAt ?? f.createdAt,
  }));
  const pagination = data?.pagination;

  const handleSort = (key: string) => {
    setPage(1);
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-zinc-300 dark:text-zinc-700" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-zinc-900 dark:text-zinc-100" /> : <ArrowDown className="ml-2 h-4 w-4 text-zinc-900 dark:text-zinc-100" />;
  };

  const statusLabel = statusFilter === "all"
    ? "Status: All"
    : `Status: ${statusFilter[0].toUpperCase()}${statusFilter.slice(1)}`;
  const classificationLabel = classificationFilter === "all"
    ? "Classification: All"
    : `Classification: ${classificationFilter[0].toUpperCase()}${classificationFilter.slice(1)}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Follow Ups</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Ready-to-send messages for hot and warm leads.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-[#111827] border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-1.5 shadow-sm">
            {syncMutation.isPending ? "Syncing..." : `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`}
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-1 h-6 w-6 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
              <SelectValue>{statusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classificationFilter} onValueChange={setClassificationFilter}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
              <SelectValue>{classificationLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Classification: All</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#111827] overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900 h-10 border-b border-zinc-200 dark:border-zinc-800">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('leadName')}>
                <div className="flex items-center">Lead Name <SortIcon column="leadName" /></div>
              </TableHead>
              <TableHead>Contact / History</TableHead>
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center">Status <SortIcon column="status" /></div>
              </TableHead>
              <TableHead className="max-w-[300px]">Message Preview</TableHead>
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('createdAt')}>
                <div className="flex items-center">Last Action <SortIcon column="createdAt" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={6} className="h-32 text-center text-zinc-500"><span className="animate-pulse">Loading...</span></TableCell></TableRow>
            ) : followups.length === 0 ? (
               <TableRow><TableCell colSpan={6} className="h-32 text-center text-zinc-500">No follow ups found.</TableCell></TableRow>
            ) : (
              followups.map((f: any) => (
                <TableRow key={f.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50">
                  <TableCell>
                    <Link to={`/admin/leads/${f.lead.id}`} className="font-medium text-gray-900 dark:text-gray-200 hover:underline transition-colors">
                      {f.lead.name}
                    </Link>
                    <div className="mt-1 flex gap-2">
                       <Badge variant="outline" className="text-[10px] uppercase border-zinc-200 dark:border-zinc-700">{f.lead.classification}</Badge>
                       <Badge variant="secondary" className="text-[10px] uppercase bg-zinc-100 dark:bg-zinc-800 shadow-none border-none text-zinc-700 dark:text-zinc-300">{f.channel}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">{f.lead.phone}</div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{f.historyCount} previous messages</div>
                  </TableCell>
                  <TableCell>
                    {f.status === 'ready' ? (
                      <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-none border-none hover:bg-gray-200 dark:hover:bg-gray-700/50">Ready to send</Badge>
                    ) : f.status === 'opened' ? (
                      <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 shadow-none border-none hover:bg-emerald-200 dark:hover:bg-emerald-900/50"><Check className="mr-1 h-3 w-3"/> Opened</Badge>
                    ) : (
                      <Badge variant="outline">{f.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 truncate bg-zinc-50 dark:bg-[#1A2234] p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800/50 shadow-sm" title={f.message}>
                      {f.message}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500 dark:text-zinc-400">
                    <div>{format(new Date(f.lastActionTime), "MMM d")}</div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">{format(new Date(f.lastActionTime), "HH:mm")}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {f.waMeLink && (
                        <a href={f.waMeLink} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 h-7 gap-1 px-2.5 bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/20 hover:text-[#25D366]">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            WhatsApp
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const nextMessage = window.prompt("Edit first message", f.message);
                          if (!nextMessage || nextMessage === f.message) return;
                          await adminApi.updateFollowUpMessage(f.id, nextMessage);
                          queryClient.invalidateQueries({ queryKey: ["followups"] });
                        }}
                      >
                        Edit Message
                      </Button>
                      {f.status === 'ready' && (
                        <Button 
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: f.id, status: 'opened' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Mark Opened
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <div>
          Showing page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1} • {pagination?.total ?? followups.length} follow-ups
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={(pagination?.page ?? 1) <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={(pagination?.page ?? 1) >= (pagination?.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
