import { useAuth } from "@/hooks/useAuth";
import type { User, Lead } from "@shared/schema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { AdminBackButton } from "@/components/AdminBackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Search,
  Download,
  Calendar,
  User as UserIcon,
  Phone,
  Mail,
  MessageSquare,
  Globe,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Plus,
  ExternalLink,
  StickyNote,
} from "lucide-react";

type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "closed";

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new:       { label: "New",       className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  contacted: { label: "Contacted", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  qualified: { label: "Qualified", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  converted: { label: "Converted", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  closed:    { label: "Closed",    className: "bg-muted text-muted-foreground border-border" },
};

function getSourceBadge(source: string) {
  const labels: Record<string, string> = {
    live_chat: "Live Chat",
    contact_form: "Contact Form",
    home_enquiry: "Home Enquiry",
    configurator: "Configurator",
  };
  return (
    <Badge variant="secondary" className="text-xs shrink-0">
      {labels[source] ?? source.replace(/_/g, " ")}
    </Badge>
  );
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatNoteDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminLeads() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // CRM expansion state
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) =>
    setExpandedLeads((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (user && (!user.adminRole || user.adminRole === "none")) {
      toast({ title: "Access Denied", description: "Admin access required.", variant: "destructive" });
      setTimeout(() => { window.location.href = "/"; }, 1000);
    }
  }, [user, toast]);

  const { data: leads = [], isLoading: leadsLoading, error: leadsError, isFetching: leadsFetching } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) =>
      apiRequest("PATCH", `/api/admin/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update lead." });
    },
  });

  const handleStatusChange = (lead: Lead, status: LeadStatus) => {
    updateLeadMutation.mutate({ id: lead.id, data: { status } });
  };

  const handleAddNote = (lead: Lead) => {
    const text = (noteInputs[lead.id] || "").trim();
    if (!text) return;
    const newNote = { text, timestamp: new Date().toISOString(), author: user?.username || "Admin" };
    const existing = (lead as any).crmNotes || [];
    updateLeadMutation.mutate(
      { id: lead.id, data: { crmNotes: [...existing, newNote] } as any },
      { onSuccess: () => setNoteInputs((prev) => ({ ...prev, [lead.id]: "" })) }
    );
  };

  // Filtering & sorting
  const filteredLeads = leads
    .filter((lead) => {
      const term = searchTerm.toLowerCase();
      if (term && ![lead.name, lead.email, lead.phone, lead.message].some(
        (f) => f?.toLowerCase().includes(term)
      )) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (dateFilter !== "all" && lead.createdAt) {
        const d = new Date(lead.createdAt);
        const now = new Date();
        if (dateFilter === "today") {
          if (d.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === "week") {
          const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
          if (d < weekAgo) return false;
        } else if (dateFilter === "month") {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const uniqueSources = [...new Set(leads.map((l) => l.source))];

  const handleExportLeads = () => {
    if (filteredLeads.length === 0) {
      toast({ title: "No Data", description: "No leads to export with current filters.", variant: "destructive" });
      return;
    }
    const headers = ["Name", "Email", "Phone", "Source", "Status", "Message", "Date"];
    const rows = filteredLeads.map((l) => [
      `"${l.name}"`, `"${l.email}"`, `"${l.phone || ""}"`,
      `"${l.source}"`, `"${(l as any).status || "new"}"`,
      `"${(l.message || "").replace(/"/g, '""')}"`,
      `"${formatDate(l.createdAt)}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `leads-export-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: `Exported ${filteredLeads.length} leads.` });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.adminRole || user.adminRole === "none") return null;

  if (leadsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Failed to load leads</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                Lead Management
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Track and manage customer inquiries and leads
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span className={`w-1.5 h-1.5 rounded-full ${leadsFetching ? "bg-amber-400 animate-pulse" : "bg-green-500"}`} />
                  {leadsFetching ? "Refreshing…" : "Live — updates every 30s"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" onClick={handleExportLeads} data-testid="button-export-leads">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" asChild>
                <a href="/admin" data-testid="link-back-to-dashboard">Back to Dashboard</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <AdminBackButton />

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-leads"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-source-filter">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {uniqueSources.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-date-filter">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-sort-leads">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold" data-testid="stat-total-leads">{leads.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold" data-testid="stat-week-leads">
                  {leads.filter((l) => {
                    if (!l.createdAt) return false;
                    const d = new Date(l.createdAt);
                    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                    return d >= weekAgo;
                  }).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-2xl font-bold" data-testid="stat-today-leads">
                  {leads.filter((l) => l.createdAt && new Date(l.createdAt).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Top Source</p>
                <p className="text-sm font-bold truncate" data-testid="stat-top-source">
                  {(() => {
                    const counts = leads.reduce<Record<string, number>>((acc, l) => {
                      acc[l.source] = (acc[l.source] || 0) + 1;
                      return acc;
                    }, {});
                    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                    return top ? top[0].replace(/_/g, " ") : "—";
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads list */}
        {leadsLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading leads...</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leads found</h3>
              <p className="text-muted-foreground">
                {searchTerm || sourceFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters to see more leads."
                  : "Customer inquiries and leads will appear here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => {
              const isExpanded = expandedLeads.has(lead.id);
              const status = ((lead as any).status || "new") as LeadStatus;
              const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
              const crmNotes: Array<{ text: string; timestamp: string; author?: string }> =
                (lead as any).crmNotes || [];

              return (
                <Card key={lead.id} data-testid={`card-lead-${lead.id}`}>
                  {/* ── Main summary row ── */}
                  <div
                    className="px-5 py-4 cursor-pointer"
                    onClick={() => toggleExpand(lead.id)}
                    data-testid={`button-expand-lead-${lead.id}`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      {/* Left: name + contact */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <UserIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl font-bold leading-tight" data-testid={`text-lead-name-${lead.id}`}>
                              {lead.name}
                            </span>
                            {getSourceBadge(lead.source)}
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold border ${statusCfg.className}`}
                              data-testid={`badge-lead-status-${lead.id}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 flex-wrap">
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 font-bold text-foreground hover:text-[#8bc440] transition-colors text-base"
                                data-testid={`link-lead-phone-${lead.id}`}
                              >
                                <Phone className="w-4 h-4 shrink-0" />
                                {lead.phone}
                              </a>
                            )}
                            <a
                              href={`mailto:${lead.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              data-testid={`link-lead-email-${lead.id}`}
                            >
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              {lead.email}
                            </a>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 shrink-0" />
                              {formatDate(lead.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: expand toggle */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {crmNotes.length} {crmNotes.length === 1 ? "note" : "notes"}
                        </span>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </div>
                  </div>

                  {/* ── CRM expanded panel ── */}
                  {isExpanded && (
                    <div className="border-t px-5 py-4 space-y-5">

                      {/* Original message */}
                      {lead.message && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> Original Message
                          </p>
                          <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">{lead.message}</p>
                        </div>
                      )}

                      {/* Status + Start Configurator */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
                          <Select
                            value={status}
                            onValueChange={(v) => handleStatusChange(lead, v as LeadStatus)}
                          >
                            <SelectTrigger
                              className="h-8 text-xs w-36"
                              data-testid={`select-lead-status-${lead.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]).map(([val, cfg]) => (
                                <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          size="sm"
                          className="bg-[#8bc440e6] text-[#191919] ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open("/configurator/van", "_blank");
                          }}
                          data-testid={`button-start-configurator-${lead.id}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Start Configurator
                        </Button>
                      </div>

                      {/* Notes history */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                          <StickyNote className="w-3.5 h-3.5" /> Notes ({crmNotes.length})
                        </p>
                        {crmNotes.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {crmNotes.map((note, i) => (
                              <div key={i} className="bg-muted rounded-md px-3 py-2">
                                <p className="text-sm">{note.text}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {note.author && <span className="font-medium">{note.author} · </span>}
                                  {formatNoteDate(note.timestamp)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mb-3 italic">No notes yet.</p>
                        )}

                        {/* Add note */}
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Add a note about this lead…"
                            value={noteInputs[lead.id] || ""}
                            onChange={(e) => setNoteInputs((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                            className="resize-none text-sm min-h-[60px]"
                            rows={2}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote(lead);
                            }}
                            data-testid={`input-lead-note-${lead.id}`}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleAddNote(lead); }}
                            disabled={!noteInputs[lead.id]?.trim() || updateLeadMutation.isPending}
                            className="self-end"
                            data-testid={`button-add-note-${lead.id}`}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Tip: Ctrl+Enter to save quickly</p>
                      </div>

                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
