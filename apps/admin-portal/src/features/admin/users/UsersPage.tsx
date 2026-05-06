import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Search, Plus, UserX, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User } from "../../../types/admin.types";
import { toast } from "sonner";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{key: keyof User, direction: 'asc'|'desc'}>({ key: 'createdAt', direction: 'desc' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => adminApi.getUsers(),
  });

  const deactivateMutation = useMutation({
    mutationFn: adminApi.deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete user.");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({id, payload}: {id: string, payload: any}) => adminApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Status updated");
    }
  });

  const addRmMutation = useMutation({
    mutationFn: adminApi.createRM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsAddOpen(false);
      reset();
      toast.success("Relationship Manager created successfully.");
    },
    onError: () => {
      toast.error("Failed to create RM.");
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({id, payload}: {id: string, payload: any}) => adminApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      reset();
      toast.success("User updated successfully");
    }
  });

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", role: "rm", isActive: true },
  });

  const onSubmit = (data: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, payload: data });
    } else {
      addRmMutation.mutate(data);
    }
  };

  const resendInviteMutation = useMutation({
    mutationFn: adminApi.resendInvite,
    onSuccess: () => {
      toast.success("Invite email sent.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send invite email.");
    },
  });

  const handleEdit = (user: User) => {
    reset({ name: user.name, email: user.email, role: user.role, isActive: user.isActive });
    setEditingUser(user);
  };

  const users = data?.data || [];

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }
    
    if (roleFilter !== "all") {
      result = result.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== "all") {
      const isActiveFilter = statusFilter === "active";
      result = result.filter(u => u.isActive === isActiveFilter);
    }

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
  }, [users, search, roleFilter, statusFilter, sortConfig]);

  const handleSort = (key: keyof User) => {
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Users & RMs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage admins and relationship managers.</p>
        </div>
        
        <Dialog open={isAddOpen || !!editingUser} onOpenChange={(open) => {
          if(!open) { setIsAddOpen(false); setEditingUser(null); reset({name: "", email: "", role: "rm", isActive: true}); }
          else setIsAddOpen(true);
        }}>
          <DialogTrigger className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 h-8 gap-1.5 px-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white" onClick={() => { reset({name: "", email: "", role: "rm", isActive: true}); setEditingUser(null); }}>
              <Plus className="mr-2 h-4 w-4" /> Add RM
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-[#111827] border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">{editingUser ? "Edit User" : "Add Relationship Manager"}</DialogTitle>
              <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                {editingUser ? "Update user details below." : "Create a new RM account. They will receive an email to set their password."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300">Full Name</Label>
                <Input id="name" {...register("name")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email</Label>
                <Input id="email" type="email" {...register("email")} disabled={!!editingUser} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message as string}</p>}
              </div>
              {editingUser && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-zinc-700 dark:text-zinc-300">Role</Label>
                    <Controller name="role" control={control} render={({field}) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="rm">RM</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <Label htmlFor="status" className="text-zinc-700 dark:text-zinc-300">Status</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Controller name="isActive" control={control} render={({field}) => (
                        <Switch id="status" checked={field.value} onCheckedChange={field.onChange} />
                      )} />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Active</span>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={addRmMutation.isPending || updateUserMutation.isPending} className="bg-gray-900 border border-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900   text-white">
                  {addRmMutation.isPending || updateUserMutation.isPending ? "Saving..." : "Save User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-[#111827] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="rm">RM</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#111827] overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900 h-10 border-b border-zinc-200 dark:border-zinc-800">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center">User <SortIcon column="name" /></div>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('assignedLeadCount')}>
                 <div className="flex items-center justify-center">Assigned Leads <SortIcon column="assignedLeadCount" /></div>
              </TableHead>
              <TableHead className="text-center cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => handleSort('convertedCount')}>
                 <div className="flex items-center justify-center">Converted <SortIcon column="convertedCount" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                   <span className="animate-pulse">Loading users...</span>
                 </TableCell>
               </TableRow>
            ) : filteredAndSortedUsers.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                   No users found.
                 </TableCell>
               </TableRow>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <TableRow key={user.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50">
                  <TableCell>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{user.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase text-[10px] tracking-wider border-zinc-200 dark:border-zinc-700">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                       <Switch 
                         checked={user.isActive} 
                         onCheckedChange={(checked) => {
                           updateStatusMutation.mutate({ id: user.id, payload: { ...user, isActive: checked } });
                         }}
                         disabled={user.role === "admin" || updateStatusMutation.isPending}
                       />
                       {user.isActive ? (
                         <span className="text-sm text-emerald-600 dark:text-emerald-400">Active</span>
                       ) : (
                         <span className="text-sm text-zinc-500 dark:text-zinc-400">Inactive</span>
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {user.assignedLeadCount ?? "-"}
                  </TableCell>
                  <TableCell className="text-center text-zinc-600 dark:text-zinc-300">
                    {user.convertedCount ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role !== "admin" && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.invitePending && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                            onClick={() => resendInviteMutation.mutate(user.id)}
                          >
                            Resend Invite
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => {
                            if(confirm("This will permanently delete the user account. Proceed?")) {
                              deactivateMutation.mutate(user.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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
