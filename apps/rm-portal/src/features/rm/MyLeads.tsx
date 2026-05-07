import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { rmApi } from "../../services/rmApi";
import { phoneCountryOptions } from "../../../../shared/phoneCountryOptions";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search } from "lucide-react";

const addLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  countryIso: z.string().length(2, "Country is required"),
  countryCode: z.string().regex(/^\+\d{1,4}$/, "Enter a valid country code"),
  mobileNumber: z
    .string()
    .min(6, "Mobile number is required")
    .regex(/^\d+$/, "Mobile number should contain only digits"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  preferredLanguage: z.enum(["english", "hindi", "hinglish"]),
  preferredContactMethod: z.enum(["chat_now", "call_under_5_min"]),
});

type AddLeadForm = z.infer<typeof addLeadSchema>;

type SortKey = "name" | "status" | "classification" | "score" | "createdAt" | "preferredLanguage";

const STATUS_OPTIONS = [
  { value: "all", label: "Status: All" },
  { value: "new", label: "New" },
  { value: "pending_contact", label: "Pending" },
  { value: "conversation_completed", label: "AI Completed" },
  { value: "assigned_to_rm", label: "Assigned" },
  { value: "follow_up_scheduled", label: "Follow Up" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
] as const;

const CLASS_OPTIONS = [
  { value: "all", label: "Classification: All" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
] as const;

function formatCreatedAt(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "new":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "pending_contact":
      return "bg-amber-50 text-amber-800 border-amber-100";
    case "conversation_completed":
      return "bg-slate-50 text-slate-600 border-slate-200";
    case "assigned_to_rm":
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    case "follow_up_scheduled":
      return "bg-purple-50 text-purple-800 border-purple-100";
    case "converted":
      return "bg-emerald-50 text-emerald-800 border-emerald-100";
    case "closed":
      return "bg-slate-50 text-slate-500 border-slate-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function statusLabel(status: string) {
  const found = STATUS_OPTIONS.find((o) => o.value === status);
  return found?.label.replace(/^Status: /, "") ?? status.replace(/_/g, " ");
}

function classificationPillClass(c: string) {
  if (c === "hot") return "bg-orange-500 text-white border-orange-500";
  if (c === "warm") return "bg-amber-400 text-white border-amber-400";
  return "bg-cyan-500 text-white border-cyan-500";
}

function SortIcon({
  column,
  sortConfig,
}: {
  column: SortKey;
  sortConfig: { key: SortKey; direction: "asc" | "desc" };
}) {
  if (sortConfig.key !== column) {
    return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-slate-300" />;
  }
  return sortConfig.direction === "asc" ? (
    <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-slate-700" />
  ) : (
    <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-slate-700" />
  );
}

export const MyLeads = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [classification, setClassification] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["rm-leads", search, classification, statusFilter, sortConfig, page],
    queryFn: () =>
      rmApi.getRMLeads({
        page,
        pageSize: 20,
        search: search.trim() || undefined,
        classification,
        status: statusFilter,
        sortBy: sortConfig.key === "score" ? "score" : sortConfig.key,
        sortDirection: sortConfig.direction,
      }),
  });

  const leads = data?.data ?? [];
  const pagination = data?.pagination;

  const createLeadMutation = useMutation({
    mutationFn: rmApi.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["rm-dash"] });
      setIsDialogOpen(false);
      reset({
        name: "",
        countryIso: "IN",
        countryCode: "+91",
        mobileNumber: "",
        email: "",
        address: "",
        preferredLanguage: "english",
        preferredContactMethod: "chat_now",
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AddLeadForm>({
    resolver: zodResolver(addLeadSchema),
    defaultValues: {
      name: "",
      countryIso: "IN",
      countryCode: "+91",
      mobileNumber: "",
      email: "",
      address: "",
      preferredLanguage: "english",
      preferredContactMethod: "chat_now",
    },
  });

  const selectedCountry =
    phoneCountryOptions.find((option) => option.iso === watch("countryIso")) ?? phoneCountryOptions[0];

  const handleSort = (key: SortKey) => {
    setPage(1);
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search name, phone or city..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <select
            aria-label="Filter by classification"
            value={classification}
            onChange={(e) => {
              setPage(1);
              setClassification(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700"
          >
            {CLASS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 min-w-[160px]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 border border-blue-600 rounded-xl text-xs font-bold text-white hover:bg-blue-700 transition-all"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {isDialogOpen && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Create lead</h3>
            <button type="button" onClick={() => setIsDialogOpen(false)} className="text-sm text-slate-500">
              Close
            </button>
          </div>
          <form
            onSubmit={handleSubmit((form: AddLeadForm) => createLeadMutation.mutate(form))}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full name</label>
              <input
                {...register("name")}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                placeholder="Full name"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country</label>
              <select
                aria-label="Country"
                {...register("countryIso", {
                  onChange: (event) => {
                    const next =
                      phoneCountryOptions.find((option) => option.iso === event.target.value) ??
                      phoneCountryOptions[0];
                    setValue("countryIso", next.iso, { shouldValidate: true });
                    setValue("countryCode", next.code, { shouldValidate: true });
                  },
                })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                {phoneCountryOptions.map((option) => (
                  <option key={option.iso} value={option.iso}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.countryIso && <p className="text-xs text-red-600 mt-1">{errors.countryIso.message}</p>}
            </div>
            <div className="flex gap-3 items-end">
              <div className="w-24">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Code</label>
                <input
                  aria-label="Country code"
                  {...register("countryCode")}
                  value={selectedCountry.code}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile</label>
                <input
                  {...register("mobileNumber")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  placeholder="Mobile number"
                />
                {(errors.mobileNumber || errors.countryCode) && (
                  <p className="text-xs text-red-600 mt-1">
                    {(errors.mobileNumber?.message as string) || (errors.countryCode?.message as string)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (optional)</label>
              <input {...register("email")} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address (optional)</label>
              <input {...register("address")} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Language</label>
              <select
                aria-label="Preferred language"
                {...register("preferredLanguage")}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preferred method</label>
              <select
                aria-label="Preferred contact method"
                {...register("preferredContactMethod")}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                <option value="chat_now">Chat now</option>
                <option value="call_under_5_min">Call in under 5 minutes</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {createLeadMutation.isPending ? "Creating…" : "Create lead"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-5">
                  <button type="button" className="flex items-center hover:text-slate-700" onClick={() => handleSort("name")}>
                    Lead <SortIcon column="name" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="px-6 py-5">Channel</th>
                <th className="px-6 py-5">Source</th>
                <th className="px-6 py-5">
                  <button type="button" className="flex items-center hover:text-slate-700" onClick={() => handleSort("status")}>
                    Status <SortIcon column="status" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="px-6 py-5">
                  <button
                    type="button"
                    className="flex items-center hover:text-slate-700"
                    onClick={() => handleSort("classification")}
                  >
                    Classification <SortIcon column="classification" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="px-6 py-5 text-right">
                  <button type="button" className="ml-auto flex items-center hover:text-slate-700" onClick={() => handleSort("score")}>
                    Score <SortIcon column="score" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="px-6 py-5">Created By</th>
                <th className="px-6 py-5">
                  <button type="button" className="flex items-center hover:text-slate-700" onClick={() => handleSort("createdAt")}>
                    Created <SortIcon column="createdAt" sortConfig={sortConfig} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400 animate-pulse">
                    Loading leads…
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-500">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead: any) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/50 transition-all cursor-pointer group"
                    onClick={() => navigate({ to: "/rm/leads/$leadId", params: { leadId: lead.id } })}
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{lead.name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {lead.phone} • {lead.city || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 capitalize">{lead.preferredChannel || "—"}</td>
                    <td className="px-6 py-5 text-sm text-slate-600">{lead.sourceLabel || "—"}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusBadgeClass(lead.status)}`}
                      >
                        {statusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight border ${classificationPillClass(lead.classification)}`}
                      >
                        {lead.classification}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-xl text-blue-600 tabular-nums">{lead.latestScore}</td>
                    <td className="px-6 py-5 text-sm text-slate-700">
                      {lead.createdByUser ? (
                        <div>
                          <div className="font-semibold">{lead.createdByUser.name}</div>
                          <div className="text-xs text-slate-400">{lead.createdByUser.id}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">System / self</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">{formatCreatedAt(lead.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1} • {pagination?.total ?? leads.length} leads
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={(pagination?.page ?? 1) <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={(pagination?.page ?? 1) >= (pagination?.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
