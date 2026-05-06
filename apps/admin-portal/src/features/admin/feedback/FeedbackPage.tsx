import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Link } from "../../../lib/routerCompat";
import { ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { Feedback } from "../../../types/admin.types";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const feedbackSchema = z.object({
  leadId: z.string().min(1, "Lead is required"),
  rmId: z.string().min(1, "RM is required"),
  originalClassification: z.string().min(1, "Required"),
  correctedClassification: z.string().min(1, "Required"),
  originalScore: z.coerce.number().min(0).max(100),
  correctedScore: z.coerce.number().min(0).max(100),
  comment: z.string().min(1, "Comment is required"),
});

export default function FeedbackPage() {
  const [sortConfig, setSortConfig] = useState<{key: keyof Feedback, direction: 'asc'|'desc'}>({ key: 'createdAt', direction: 'desc' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => adminApi.getFeedback(),
  });

  const { data: leadsData } = useQuery({
    queryKey: ["leads"],
    queryFn: () => adminApi.getLeads({}),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => adminApi.getUsers(),
  });

  const addFeedbackMutation = useMutation({
    mutationFn: adminApi.addFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setIsAddOpen(false);
      reset();
      toast.success("Feedback submitted successfully");
    },
    onError: () => {
      toast.error("Failed to submit feedback");
    }
  });

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      leadId: "", rmId: "", originalClassification: "", correctedClassification: "",
      originalScore: 0, correctedScore: 0, comment: ""
    }
  });

  const onSubmit = (data: any) => {
    addFeedbackMutation.mutate(data);
  };

  const feedback = data?.data || [];
  const leads = leadsData?.data || [];
  const rms = usersData?.data?.filter((u: any) => u.role === "rm") || [];

  const sortedFeedback = useMemo(() => {
    let result = [...feedback];

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
  }, [feedback, sortConfig]);

  const handleSort = (key: keyof Feedback) => {
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Feedback</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Review RM feedback on AI scoring.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 h-8 gap-1.5 px-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Feedback
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">Submit AI Feedback</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Lead</Label>
                <Controller name="leadId" control={control} render={({field}) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                      <SelectValue placeholder="Select a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.leadId && <p className="text-sm text-red-500">{errors.leadId.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">RM</Label>
                <Controller name="rmId" control={control} render={({field}) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                      <SelectValue placeholder="Select RM" />
                    </SelectTrigger>
                    <SelectContent>
                      {rms.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.rmId && <p className="text-sm text-red-500">{errors.rmId.message as string}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-700 dark:text-zinc-300">Original Category</Label>
                  <Controller name="originalClassification" control={control} render={({field}) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"><SelectValue placeholder="Original" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cold">Cold</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-700 dark:text-zinc-300">Corrected Category</Label>
                  <Controller name="correctedClassification" control={control} render={({field}) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"><SelectValue placeholder="Corrected" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cold">Cold</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-700 dark:text-zinc-300">Original Score</Label>
                  <Input type="number" {...register("originalScore")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-700 dark:text-zinc-300">Corrected Score</Label>
                  <Input type="number" {...register("correctedScore")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Comment</Label>
                <Textarea {...register("comment")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                {errors.comment && <p className="text-sm text-red-500">{errors.comment.message as string}</p>}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={addFeedbackMutation.isPending} className="bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900   text-white">
                  {addFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#111827] overflow-x-auto shadow-sm">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-40 px-4 py-2 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('leadName')}>
                <div className="flex items-center">Lead <SortIcon column="leadName" /></div>
              </TableHead>
              <TableHead className="w-40 px-4 py-2 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('rmName')}>
                <div className="flex items-center">RM <SortIcon column="rmName" /></div>
              </TableHead>
              <TableHead className="w-48 px-4 py-2">Classification</TableHead>
              <TableHead className="w-32 px-4 py-2">Score</TableHead>
              <TableHead className="px-4 py-2">Comment</TableHead>
              <TableHead className="w-40 px-4 py-2 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-right" onClick={() => handleSort('createdAt')}>
                <div className="flex items-center justify-end">Date <SortIcon column="createdAt" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={6} className="h-32 text-center text-zinc-500"><span className="animate-pulse">Loading feedback...</span></TableCell></TableRow>
            ) : sortedFeedback.length === 0 ? (
               <TableRow><TableCell colSpan={6} className="h-32 text-center text-zinc-500">No feedback submitted.</TableCell></TableRow>
            ) : (
              sortedFeedback.map((f) => (
                <TableRow key={f.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50">
                  <TableCell className="px-4 py-2 align-middle">
                    <Link to={`/admin/leads/${f.leadId}`} className="font-medium text-gray-900 dark:text-gray-200 hover:underline">
                      {f.leadName}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-2 align-middle text-sm text-zinc-600 dark:text-zinc-300">{f.rmName}</TableCell>
                  <TableCell className="px-4 py-2 align-middle">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="uppercase text-xs text-zinc-500 dark:text-zinc-400">{f.originalClassification}</span>
                      <ArrowRight className="h-3 w-3 text-zinc-400" />
                      <span className="uppercase text-xs font-semibold text-zinc-900 dark:text-zinc-100">{f.correctedClassification}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2 align-middle">
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <span className="text-zinc-500 dark:text-zinc-400 line-through">{f.originalScore}</span>
                      <ArrowRight className="h-3 w-3 text-zinc-400" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{f.correctedScore}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2 align-middle">
                    <div className="text-sm text-zinc-600 dark:text-zinc-300 w-full">
                      <p className="truncate block" title={f.comment}>{f.comment}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2 align-middle text-sm text-zinc-500 dark:text-zinc-400 text-right">
                    {format(new Date(f.createdAt), "MMM d, HH:mm")}
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
