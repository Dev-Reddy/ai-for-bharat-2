import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Campaign } from "../../../types/admin.types";
import { toast } from "sonner";
import { useNavigate } from "../../../lib/routerCompat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  source: z.string().min(1, "Source is required"),
  budget: z.coerce.number().optional(),
});

export default function CampaignsPage() {
  const [sortConfig, setSortConfig] = useState<{key: keyof Campaign, direction: 'asc'|'desc'}>({ key: 'leadCount', direction: 'desc' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => adminApi.getCampaigns(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => adminApi.updateCampaignStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign updated");
    }
  });

  const addCampMutation = useMutation({
    mutationFn: adminApi.addCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setIsAddOpen(false);
      reset();
      toast.success("Campaign created");
    }
  });

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: "", source: "website", budget: 0 },
  });

  const onSubmit = (data: any) => {
    addCampMutation.mutate(data);
  };

  const campaigns = data?.data || [];

  const sortedCampaigns = useMemo(() => {
    let result = [...campaigns];

    result.sort((a, b) => {
      let aVal: any = a[sortConfig.key] || 0;
      let bVal: any = b[sortConfig.key] || 0;
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [campaigns, sortConfig]);

  const handleSort = (key: keyof Campaign) => {
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Campaigns</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Track and manage lead acquisition campaigns.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/80 h-8 gap-1.5 px-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-800 hover:bg-gray-800 dark:hover:bg-gray-200">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">Create Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Campaign Name</Label>
                <Input {...register("name")} placeholder="e.g. Q3 Push" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Source</Label>
                <Controller name="source" control={control} render={({field}) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                      <SelectValue placeholder="Select a source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="google">Google Ads</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {errors.source && <p className="text-sm text-red-500">{errors.source.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Budget (Optional)</Label>
                <Input type="number" {...register("budget")} placeholder="0.00" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addCampMutation.isPending} className="bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900   text-white">
                  {addCampMutation.isPending ? "Creating..." : "Save Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#111827] overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900 h-10 border-b border-zinc-200 dark:border-zinc-800">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center">Campaign Name <SortIcon column="name" /></div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('leadCount')}>
                <div className="flex items-center justify-end">Total Leads <SortIcon column="leadCount" /></div>
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('hotCount')}>
                <div className="flex items-center justify-end">Hot <SortIcon column="hotCount" /></div>
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('warmCount')}>
                <div className="flex items-center justify-end">Warm <SortIcon column="warmCount" /></div>
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('coldCount')}>
                <div className="flex items-center justify-end">Cold <SortIcon column="coldCount" /></div>
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('convertedCount')}>
                <div className="flex items-center justify-end">Converted <SortIcon column="convertedCount" /></div>
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={9} className="h-32 text-center text-zinc-500"><span className="animate-pulse">Loading campaigns...</span></TableCell></TableRow>
            ) : sortedCampaigns.length === 0 ? (
               <TableRow><TableCell colSpan={9} className="h-32 text-center text-zinc-500">No campaigns found.</TableCell></TableRow>
            ) : (
              sortedCampaigns.map((camp) => (
                <TableRow 
                  key={camp.id} 
                  className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 cursor-pointer" 
                  onClick={(e) => {
                     if ((e.target as HTMLElement).closest('button')) return;
                     navigate(`/admin/campaigns/${camp.id}`);
                  }}
                >
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">{camp.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                       <Switch 
                         checked={camp.isActive} 
                         onCheckedChange={(checked) => toggleMutation.mutate({ id: camp.id, isActive: checked })}
                         disabled={toggleMutation.isPending}
                       />
                       <span className="text-sm text-zinc-500 dark:text-zinc-400">{camp.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">{camp.source}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-zinc-900 dark:text-zinc-100">{camp.leadCount}</TableCell>
                  <TableCell className="text-right text-orange-500 dark:text-orange-400">{camp.hotCount}</TableCell>
                  <TableCell className="text-right text-yellow-500 dark:text-yellow-400">{camp.warmCount}</TableCell>
                  <TableCell className="text-right text-cyan-500 dark:text-cyan-400">{camp.coldCount}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{camp.convertedCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400" onClick={(e) => { e.stopPropagation(); navigate(`/admin/campaigns/${camp.id}`); }}>View</Button>
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
