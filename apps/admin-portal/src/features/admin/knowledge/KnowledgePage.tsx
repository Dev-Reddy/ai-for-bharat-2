import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, Plus, ArrowUpDown, ArrowUp, ArrowDown, Trash2, UploadCloud, X } from "lucide-react";
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
  content: z.string().optional(),
});

export default function KnowledgePage() {
  const [sortConfig, setSortConfig] = useState<{key: keyof KnowledgeDocument, direction: 'asc'|'desc'}>({ key: 'updatedAt', direction: 'desc' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge"],
    queryFn: () => adminApi.getKnowledgeDocuments(),
  });

  const addDocMutation = useMutation({
    mutationFn: adminApi.addKnowledgeDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      setIsAddOpen(false);
      reset();
      setUploadedFile(null);
      toast.success("Document added successfully");
    }
  });

  const updateDocMutation = useMutation({
    mutationFn: ({id, payload}: {id: string, payload: any}) => adminApi.updateKnowledgeDocument(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      setEditingDoc(null);
      reset();
      setUploadedFile(null);
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
    reset({ title: doc.title, type: doc.type, content: "" });
    setEditingDoc(doc);
    setUploadedFile(null);
  };

  const onSubmit = (data: any) => {
    const payload = { ...data, fileName: uploadedFile?.name };
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
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Documents used by AI to answer lead queries.</p>
        </div>

        <Dialog open={isAddOpen || !!editingDoc} onOpenChange={(open) => {
          if(!open) { setIsAddOpen(false); setEditingDoc(null); reset({ title: "", type: "", content: "" }); setUploadedFile(null); }
          else setIsAddOpen(true);
        }}>
          <DialogTrigger className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 h-8 gap-1.5 px-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white" onClick={() => { reset({title: "", type: "", content: ""}); setEditingDoc(null); setUploadedFile(null); }}>
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
                <Label className="text-zinc-700 dark:text-zinc-300">File Upload (Optional)</Label>
                <div 
                  className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0B0F14] hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setUploadedFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFile(e.target.files[0]);
                      }
                    }}
                  />
                  {uploadedFile ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span className="font-medium truncate max-w-[200px]">{uploadedFile.name}</span>
                      <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        if(fileInputRef.current) fileInputRef.current.value = '';
                      }}>
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-zinc-400 mb-2" />
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Click to upload or drag and drop</p>
                      <p className="text-xs text-zinc-500 mt-1">PDF, DOCX, TXT up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Content (Text Fallback)</Label>
                <Textarea {...register("content")} placeholder="Paste knowledge here..." className="h-40 bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
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
                      {(doc as any).fileName && <span className="text-xs text-zinc-500 font-normal">{(doc as any).fileName}</span>}
                      {uploadedFile && doc.id === editingDoc?.id ? <span className="text-xs text-emerald-500 font-normal">Ready to upload: {uploadedFile.name}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-zinc-600 dark:text-zinc-400 font-normal shadow-none border-zinc-200 dark:border-zinc-700">{doc.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {doc.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 shadow-none border-none">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="shadow-none border-none bg-zinc-100 dark:bg-zinc-800 max-w-fit">Draft</Badge>
                    )}
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
