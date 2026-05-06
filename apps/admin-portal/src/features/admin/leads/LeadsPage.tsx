import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Link, useNavigate, useSearchParams } from "../../../lib/routerCompat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Search, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { LeadClassification, LeadStatus, Lead } from "../../../types/admin.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const addLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  preferredLanguage: z.enum(["english", "hindi", "hinglish"]).default("english"),
  preferredContactMethod: z.enum(["chat_now", "call_under_5_min"]).default("chat_now"),
});

export default function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  
  const classification = searchParams.get("classification") || "all";
  const setClassification = (val: string) => {
    setSearchParams(prev => { prev.set("classification", val); return prev; });
  };
  
  const statusFilter = searchParams.get("status") || "all";
  const setStatusFilter = (val: string) => {
    setSearchParams(prev => { prev.set("status", val); return prev; });
  };
  
  const [sortConfig, setSortConfig] = useState<{key: keyof Lead | 'score', direction: 'asc'|'desc'}>({ key: 'createdAt', direction: 'desc' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => adminApi.getLeads({}),
  });

  const addMutation = useMutation({
    mutationFn: adminApi.addLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsAddOpen(false);
      reset();
      toast.success("Lead created successfully");
    },
    onError: () => {
      toast.error("Failed to create lead");
    }
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(addLeadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      preferredLanguage: "english",
      preferredContactMethod: "chat_now",
    },
  });

  const onSubmit = (data: any) => {
    addMutation.mutate(data);
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case "new": return <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 shadow-none">New</Badge>;
      case "pending_contact": return <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-100 shadow-none border-0 pt-0.5">Pending</Badge>;
      case "conversation_completed": return <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 shadow-none border-0 pt-0.5">AI Completed</Badge>;
      case "assigned_to_rm": return <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 hover:bg-indigo-100 shadow-none border-0 pt-0.5">Assigned</Badge>;
      case "follow_up_scheduled": return <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 hover:bg-purple-100 shadow-none border-0 pt-0.5">Follow Up</Badge>;
      case "converted": return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 shadow-none border-0 pt-0.5">Converted</Badge>;
      case "closed": return <Badge variant="outline" className="text-zinc-500 shadow-none border-zinc-200 dark:border-zinc-700 pt-0.5">Closed</Badge>;
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
    let result = [...leads];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.phone.includes(q) ||
        l.city?.toLowerCase().includes(q)
      );
    }
    if (classification !== "all") {
      result = result.filter(l => l.classification === classification);
    }
    if (statusFilter !== "all") {
      result = result.filter(l => l.status === statusFilter);
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
  }, [leads, search, classification, statusFilter, sortConfig]);

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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Leads</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage all leads and their status.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 h-8 gap-1.5 px-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Lead
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">Add New Lead</DialogTitle>
              <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                Manually enter a new lead into the system. AI will process it shortly.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300">Full Name</Label>
                <Input id="name" {...register("name")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-700 dark:text-zinc-300">Phone Number</Label>
                <Input id="phone" {...register("phone")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email (Optional)</Label>
                <Input id="email" {...register("email")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-zinc-700 dark:text-zinc-300">Address (Optional)</Label>
                <Input id="address" {...register("address")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredLanguage" className="text-zinc-700 dark:text-zinc-300">Preferred Language</Label>
                <select id="preferredLanguage" {...register("preferredLanguage")} className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-[#0B0F14]">
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredContactMethod" className="text-zinc-700 dark:text-zinc-300">Preferred Method</Label>
                <select id="preferredContactMethod" {...register("preferredContactMethod")} className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-[#0B0F14]">
                  <option value="chat_now">Chat now</option>
                  <option value="call_under_5_min">Call in under 5 minutes</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addMutation.isPending} className="bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900   text-white">
                  {addMutation.isPending ? "Adding..." : "Add Lead"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
        
        <Select value={classification} onValueChange={setClassification}>
          <SelectTrigger className="w-[160px] bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="All Classifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classifications</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="pending_contact">Pending</SelectItem>
            <SelectItem value="conversation_completed">AI Completed</SelectItem>
            <SelectItem value="assigned_to_rm">Assigned</SelectItem>
            <SelectItem value="follow_up_scheduled">Follow Up</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
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
                <div className="flex items-center">Created <SortIcon column="createdAt" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                   <span className="animate-pulse">Loading leads...</span>
                 </TableCell>
               </TableRow>
            ) : filteredAndSortedLeads.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                   No leads found matching your criteria.
                 </TableCell>
               </TableRow>
            ) : (
              filteredAndSortedLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 cursor-pointer"
                  onClick={(e) => {
                    // Prevent navigation if they click on an action button directly
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
                    <Link to={`/admin/leads/${lead.id}`} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-foreground h-7 gap-1 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50">
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
