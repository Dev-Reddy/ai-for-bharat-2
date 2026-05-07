import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, Plus, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { KnowledgeDocument } from "../../../types/admin.types";
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

const docSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  content: z.string().min(20, "Paste the approved document content here"),
});

function getMem0SyncStatus(doc: KnowledgeDocument) {
  const mem0 = (doc.metadata as any)?.mem0;
  if (!mem0?.syncStatus) return null;
  return String(mem0.syncStatus);
}

function getMem0SyncError(doc: KnowledgeDocument) {
  const mem0 = (doc.metadata as any)?.mem0;
  if (!mem0?.lastError) return null;
  return String(mem0.lastError);
}

export default function KnowledgePage() {
  const [sortConfig, setSortConfig] = useState<{key: keyof KnowledgeDocument, direction: 'asc'|'desc'}>({ key: 'updatedAt', direction: 'desc' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge"],
    queryFn: () => adminApi.getKnowledgeDocuments(),
  });

  const addDocMutation = useMutation({
    mutationFn: adminApi.addKnowledgeDocument,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      setIsAddOpen(false);
      reset();
      const status = getMem0SyncStatus(result.data as KnowledgeDocument);
      if (status === "failed") {
        toast.warning("Document saved, but Mem0 indexing failed. Check sync status.");
        return;
      }
      toast.success("Document added successfully");
    }
  });

  const updateDocMutation = useMutation({
    mutationFn: ({id, payload}: {id: string, payload: any}) => adminApi.updateKnowledgeDocument(id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      setEditingDoc(null);
      reset();
      const status = getMem0SyncStatus(result.data as KnowledgeDocument);
      if (status === "failed") {
        toast.warning("Document updated, but Mem0 re-indexing failed. Check sync status.");
        return;
      }
      toast.success("Document updated successfully");
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: adminApi.deleteKnowledgeDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      toast.success("Document deleted successfully");
    }
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(docSchema),
    defaultValues: { title: "", type: "", content: "" }
  });

  const handleEditClick = (doc: KnowledgeDocument) => {
    reset({ title: doc.title, type: doc.type, content: doc.content || "" });
    setEditingDoc(doc);
  };

  const onSubmit = (data: any) => {
    const payload = { ...data };
    if (editingDoc) {
      updateDocMutation.mutate({ id: editingDoc.id, payload });
    } else {
      addDocMutation.mutate(payload);
    }
  };

  const docs = data?.data || [];

  const sortedDocs = useMemo(() => {
    let result = [...docs];

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
  }, [docs, sortConfig]);

  const handleSort = (key: keyof KnowledgeDocument) => {
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Knowledge Base</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Documents used by AI during chat and scoring. Approved content is synced to Mem0 for retrieval. Vapi upload is still manual in this MVP.</p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Allowed filename types: <code>.pdf</code>, <code>.doc</code>, <code>.docx</code>, <code>.txt</code>. Current MVP note: the pasted text content below is what is actually indexed; there is no separate backend-enforced upload size policy yet.
          </p>
        </div>

        <Dialog open={isAddOpen || !!editingDoc} onOpenChange={(open) => {
          if(!open) { setIsAddOpen(false); setEditingDoc(null); reset({ title: "", type: "", content: "" }); }
          else setIsAddOpen(true);
        }}>
          <DialogTrigger className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 h-8 gap-1.5 px-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white" onClick={() => { reset({title: "", type: "", content: ""}); setEditingDoc(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">{editingDoc ? "Edit Document" : "Add Knowledge Document"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Title</Label>
                <Input {...register("title")} placeholder="E.g. Broker Pitch Script" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Type</Label>
                <Controller name="type" control={control} render={({field}) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAQ">FAQ</SelectItem>
                      <SelectItem value="Script">Script</SelectItem>
                      <SelectItem value="Guide">Guide</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {errors.type && <p className="text-sm text-red-500">{errors.type.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Content</Label>
                <Textarea {...register("content")} placeholder="Paste knowledge here..." className="h-40 bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                {errors.content && <p className="text-sm text-red-500">{errors.content.message as string}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addDocMutation.isPending || updateDocMutation.isPending} className="bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900   text-white">
                  {addDocMutation.isPending || updateDocMutation.isPending ? "Saving..." : "Save Document"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#111827] overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('title')}>
                <div className="flex items-center">Title <SortIcon column="title" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('type')}>
                <div className="flex items-center">Type <SortIcon column="type" /></div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('updatedAt')}>
                <div className="flex items-center">Last Updated <SortIcon column="updatedAt" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={6} className="h-32 text-center text-zinc-500"><span className="animate-pulse">Loading documents...</span></TableCell></TableRow>
            ) : sortedDocs.length === 0 ? (
               <TableRow><TableCell colSpan={6} className="h-32 text-center text-zinc-500">No documents found.</TableCell></TableRow>
            ) : (
              sortedDocs.map((doc) => (
                <TableRow key={doc.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50">
                  <TableCell>
                    <FileText className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  </TableCell>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex flex-col">
                      <span>{doc.title}</span>
                      {doc.sourceFileName ? <span className="text-xs text-zinc-500 font-normal">{doc.sourceFileName}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-zinc-600 dark:text-zinc-400 font-normal shadow-none border-zinc-200 dark:border-zinc-700">{doc.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {doc.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 shadow-none border-none">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="shadow-none border-none bg-zinc-100 dark:bg-zinc-800 max-w-fit">Draft</Badge>
                      )}
                      {getMem0SyncStatus(doc) ? (
                        <Badge variant="outline" className="shadow-none border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                          Mem0 {getMem0SyncStatus(doc)}
                        </Badge>
                      ) : null}
                      {getMem0SyncError(doc) ? (
                        <Badge variant="outline" className="shadow-none border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300 max-w-[260px] truncate" title={getMem0SyncError(doc) ?? ""}>
                          {getMem0SyncError(doc)}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500 dark:text-zinc-400">
                    {format(new Date(doc.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(doc)} className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => {
                        if (confirm("Are you sure you want to delete this document?")) {
                          deleteDocMutation.mutate(doc.id);
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
