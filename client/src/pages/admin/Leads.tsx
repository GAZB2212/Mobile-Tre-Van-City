import { useAuth } from "@/hooks/useAuth";
import { useIdlePolling } from "@/hooks/useIdlePolling";
import type { User, Lead } from "@shared/schema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AdminBackButton } from "@/components/AdminBackButton";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  XCircle,
  PhoneCall,
  CheckCircle2,
  Link2,
} from "lucide-react";

const REDIRECT_DELAY_MS = 500;
const ACCESS_DENIED_REDIRECT_MS = 1000;
const POLL_INTERVAL_MS = 60_000;
const WEEK_DAYS = 7;

type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "closed" | "dead";

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new:       { label: "New",        className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  contacted: { label: "Contacted",  className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  qualified: { label: "Qualified",  className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  converted: { label: "Converted",  className: "bg-green-500/20 text-green-400 border-green-500/30" },
  closed:    { label: "Closed",     className: "bg-muted text-muted-foreground border-border" },
  dead:      { label: "Dead Lead",  className: "bg-red-500/15 text-red-400 border-red-500/30" },
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

  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showClosed, setShowClosed] = useState(false);

  // CRM expansion state
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  // Link-to-customer dialog state
  const [linkLeadId, setLinkLeadId] = useState<string | null>(null);
  const [linkCustomerSearch, setLinkCustomerSearch] = useState("");
  const [linkCustomerSelected, setLinkCustomerSelected] = useState<{ id: string; name: string; email?: string | null } | null>(null);

  // Unlink-customer confirmation state
  const [unlinkLeadId, setUnlinkLeadId] = useState<string | null>(null);

  // Follow-up scheduling prompt
  const [fuDialogOpen, setFuDialogOpen] = useState(false);
  const [fuLead, setFuLead] = useState<Lead | null>(null);
  const [fuDate, setFuDate] = useState(new Date().toISOString().split("T")[0]);
  const [fuNotes, setFuNotes] = useState("");

  const scheduleFollowUpMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/admin/follow-ups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/follow-ups"], refetchType: "all" });
      setFuDialogOpen(false);
      toast({ title: "Follow-up scheduled", description: "You can view it in the Calendar." });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to schedule follow-up" }),
  });

  const toggleExpand = (id: string) =>
    setExpandedLeads((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/login"; }, REDIRECT_DELAY_MS);
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (user && (!user.adminRole || user.adminRole === "none")) {
      toast({ title: "Access Denied", description: "Admin access required.", variant: "destructive" });
      setTimeout(() => { window.location.href = "/"; }, ACCESS_DENIED_REDIRECT_MS);
    }
  }, [user, toast]);

  const isActive = useIdlePolling();

  const { data: leads = [], isLoading: leadsLoading, error: leadsError, isFetching: leadsFetching } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
    refetchInterval: isActive ? POLL_INTERVAL_MS : false,
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

  const linkCustomerMutation = useMutation({
    mutationFn: async ({ leadId, customerId }: { leadId: string; customerId: string }) =>
      apiRequest("PATCH", `/api/admin/leads/${leadId}`, { customerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      setLinkLeadId(null);
      setLinkCustomerSearch("");
      setLinkCustomerSelected(null);
      toast({ title: "Customer linked", description: "The lead has been linked to the selected customer profile." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to link customer." });
    },
  });

  const unlinkCustomerMutation = useMutation({
    mutationFn: async (leadId: string) =>
      apiRequest("PATCH", `/api/admin/leads/${leadId}`, { customerId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      setUnlinkLeadId(null);
      toast({ title: "Customer unlinked", description: "The customer profile has been removed from this lead." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to unlink customer." });
    },
  });

  const { data: customerSearchResults = [] } = useQuery<Array<{ id: string; name: string; email?: string | null; phone?: string | null }>>({
    queryKey: ["/api/admin/customers", linkCustomerSearch],
    queryFn: () => apiRequest("GET", `/api/admin/customers${linkCustomerSearch ? `?search=${encodeURIComponent(linkCustomerSearch)}` : ""}`),
    enabled: !!linkLeadId,
    staleTime: 10_000,
  });

  const handleStatusChange = (lead: Lead, status: LeadStatus) => {
    updateLeadMutation.mutate({ id: lead.id, data: { status } });
    if (status === "contacted") {
      setFuLead(lead);
      setFuDate(new Date().toISOString().split("T")[0]);
      setFuNotes("");
      setFuDialogOpen(true);
    }
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
  const closedLeadCount = leads.filter((l) => {
    const s = (l as any).status || "new";
    return s === "closed" || s === "dead";
  }).length;

  const filteredLeads = leads
    .filter((lead) => {
      const s = (lead as any).status || "new";
      if (!showClosed && (s === "closed" || s === "dead")) return false;
      const term = searchTerm.toLowerCase();
      if (term && ![lead.name, lead.email, lead.phone, lead.message].some(
        (f) => f?.toLowerCase().includes(term)
      )) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (statusFilter !== "all" && (lead.status || "new") !== statusFilter) return false;
      if (dateFilter !== "all" && lead.createdAt) {
        const d = new Date(lead.createdAt);
        const now = new Date();
        if (dateFilter === "today") {
          if (d.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === "week") {
          const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - WEEK_DAYS);
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
      <AdminPageHeader
        title="Lead Management"
        description="Track and manage customer inquiries and leads"
        statusIndicator={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full ${leadsFetching ? "bg-amber-400 animate-pulse" : isActive ? "bg-[hsl(86_53%_51%)]" : "bg-muted-foreground/40"}`} />
            {leadsFetching ? "Refreshing…" : isActive ? `Live` : "Paused"}
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExportLeads} data-testid="button-export-leads">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          </>
        }
      />

      <div className="container mx-auto px-4 py-6">
        <AdminBackButton />

        <div className="space-y-6">
        {/* Filters */}
        <Card data-testid="card-leads-filter">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, email, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-leads"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full" data-testid="select-source-filter">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full" data-testid="select-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]).map(([val, cfg]) => (
                    <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full" data-testid="select-date-filter">
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
                <SelectTrigger className="w-full" data-testid="select-sort-leads">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result count — visible only when filters are active */}
        {!leadsLoading && (searchTerm !== "" || sourceFilter !== "all" || statusFilter !== "all" || dateFilter !== "all") && (
          <p className="text-sm text-muted-foreground" data-testid="text-leads-result-count">
            Showing <span className="font-medium text-foreground">{filteredLeads.length}</span> of{" "}
            <span className="font-medium text-foreground">{leads.length}</span>{" "}
            {filteredLeads.length === 1 ? "lead" : "leads"}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - WEEK_DAYS);
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

        {/* Closed leads toggle — always visible when there are closed/dead leads */}
        {!leadsLoading && closedLeadCount > 0 && (
          <div className="text-center">
            {!showClosed ? (
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                onClick={() => setShowClosed(true)}
                data-testid="button-show-closed-leads"
              >
                {closedLeadCount} closed {closedLeadCount === 1 ? "lead" : "leads"} hidden — show
              </button>
            ) : (
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                onClick={() => setShowClosed(false)}
                data-testid="button-hide-closed-leads"
              >
                Hide closed leads
              </button>
            )}
          </div>
        )}

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
                {!showClosed && closedLeadCount > 0
                  ? "All leads are closed."
                  : searchTerm || sourceFilter !== "all" || statusFilter !== "all" || dateFilter !== "all"
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
                <Card key={lead.id} data-testid={`card-lead-${lead.id}`} className={(status === 'dead' || status === 'closed') ? 'opacity-60' : ''}>
                  {/* ── Main summary row ── */}
                  <div className="px-5 pt-4 pb-3">
                    {/* Top row: name + status */}
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-xl font-bold leading-tight" data-testid={`text-lead-name-${lead.id}`}>
                          {lead.name}
                        </span>
                        {getSourceBadge(lead.source)}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold border ${statusCfg.className}`}
                          data-testid={`badge-lead-status-${lead.id}`}
                        >
                          {statusCfg.label}
                        </span>
                        {lead.quoteId && (
                          <Link
                            href={`/admin/quotes/${lead.quoteId}?tab=configuration&from=leads`}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              data-testid={`button-edit-config-${lead.id}`}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Edit Config
                            </Button>
                          </Link>
                        )}
                        {status !== 'closed' && status !== 'dead' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`button-quick-actions-${lead.id}`}
                              >
                                Actions
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(lead, 'contacted')}
                                data-testid={`button-mark-contacted-${lead.id}`}
                                disabled={status === 'contacted'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                Contacted
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(lead, 'closed')}
                                data-testid={`button-close-lead-${lead.id}`}
                                className="text-muted-foreground"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-2" />
                                Close lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    {/* Phone — prominent call row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {lead.phone ? (
                        <>
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 text-2xl font-bold text-[#8bc440] hover:text-[#8bc440]/80 transition-colors leading-none"
                            data-testid={`link-lead-phone-${lead.id}`}
                          >
                            <Phone className="w-5 h-5 shrink-0" />
                            {lead.phone}
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-call-${lead.id}`}
                          >
                            <Button size="sm" className="bg-[#8bc440] text-[#191919] shrink-0" tabIndex={-1}>
                              <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
                              Call now
                            </Button>
                          </a>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No phone provided</span>
                      )}
                    </div>

                    {/* Secondary row: email + date + expand */}
                    <div
                      className="flex items-center justify-between gap-3 mt-2 flex-wrap cursor-pointer"
                      onClick={() => toggleExpand(lead.id)}
                      data-testid={`button-expand-lead-${lead.id}`}
                    >
                      <div className="flex items-center gap-4 flex-wrap">
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
                        {crmNotes.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {crmNotes.length} {crmNotes.length === 1 ? "note" : "notes"}
                          </span>
                        )}
                      </div>
                      <div className="shrink-0">
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

                        {lead.customerId ? (
                          <Link
                            href={`/admin/customers/${lead.customerId}`}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                              data-testid={`text-profile-linked-${lead.id}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              Linked: {lead.name}
                            </span>
                          </Link>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                            data-testid={`text-no-profile-linked-${lead.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            No profile linked
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLinkLeadId(lead.id);
                            setLinkCustomerSearch("");
                            setLinkCustomerSelected(null);
                          }}
                          data-testid={`button-link-customer-${lead.id}`}
                        >
                          <Link2 className="w-3.5 h-3.5 mr-1.5" />
                          {lead.customerId ? "Change Customer" : "Link to Customer"}
                        </Button>
                        {lead.customerId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUnlinkLeadId(lead.id);
                            }}
                            data-testid={`button-unlink-customer-${lead.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Unlink
                          </Button>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                          {lead.customerId && (
                            <Link
                              href={`/admin/customers/${lead.customerId}`}
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-view-customer-profile-${lead.id}`}
                              >
                                <UserIcon className="w-3.5 h-3.5 mr-1.5" />
                                View Customer Profile
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            className="bg-[#8bc440e6] text-[#191919]"
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
                        <div className="flex flex-col gap-2">
                          <Textarea
                            placeholder="Add a note about this lead…"
                            value={noteInputs[lead.id] || ""}
                            onChange={(e) => setNoteInputs((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                            className="resize-none text-sm min-h-[60px] w-full"
                            rows={2}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote(lead);
                            }}
                            data-testid={`input-lead-note-${lead.id}`}
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleAddNote(lead); }}
                              disabled={!noteInputs[lead.id]?.trim() || updateLeadMutation.isPending}
                              data-testid={`button-add-note-${lead.id}`}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Add Note
                            </Button>
                          </div>
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

      {/* Unlink customer confirmation dialog */}
      <Dialog
        open={!!unlinkLeadId}
        onOpenChange={(open) => {
          if (!open) setUnlinkLeadId(null);
        }}
      >
        <DialogContent className="max-w-sm" data-testid="modal-unlink-customer">
          <DialogHeader>
            <DialogTitle>Remove customer profile link?</DialogTitle>
            <DialogDescription>
              This will clear the customer profile association from this lead. The lead and the customer profile will remain unchanged — only the link between them will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setUnlinkLeadId(null)}
              data-testid="button-cancel-unlink-customer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={unlinkCustomerMutation.isPending}
              onClick={() => {
                if (unlinkLeadId) unlinkCustomerMutation.mutate(unlinkLeadId);
              }}
              data-testid="button-confirm-unlink-customer"
            >
              {unlinkCustomerMutation.isPending ? (
                <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" /> Unlinking…</span>
              ) : (
                <><XCircle className="w-3.5 h-3.5 mr-1.5" />Remove Link</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link to customer dialog */}
      <Dialog
        open={!!linkLeadId}
        onOpenChange={(open) => {
          if (!open) {
            setLinkLeadId(null);
            setLinkCustomerSearch("");
            setLinkCustomerSelected(null);
          }
        }}
      >
        <DialogContent className="max-w-md" data-testid="modal-link-customer">
          <DialogHeader>
            <DialogTitle>Link to Customer Profile</DialogTitle>
            <DialogDescription>
              Search by name or email to find the right customer profile and link it to this lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name or email…"
                value={linkCustomerSearch}
                onChange={(e) => {
                  setLinkCustomerSearch(e.target.value);
                  setLinkCustomerSelected(null);
                }}
                className="pl-8"
                autoFocus
                data-testid="input-link-customer-search"
              />
            </div>
            <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
              {customerSearchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                  {linkCustomerSearch ? "No customers found." : "Type to search customers."}
                </p>
              ) : (
                customerSearchResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 hover-elevate transition-colors ${linkCustomerSelected?.id === c.id ? "bg-accent" : ""}`}
                    onClick={() => setLinkCustomerSelected({ id: c.id, name: c.name, email: c.email })}
                    data-testid={`option-customer-${c.id}`}
                  >
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                  </button>
                ))
              )}
            </div>
            {linkCustomerSelected && (
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{linkCustomerSelected.name}</span>
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setLinkLeadId(null);
                setLinkCustomerSearch("");
                setLinkCustomerSelected(null);
              }}
              data-testid="button-cancel-link-customer"
            >
              Cancel
            </Button>
            <Button
              disabled={!linkCustomerSelected || linkCustomerMutation.isPending}
              onClick={() => {
                if (linkLeadId && linkCustomerSelected) {
                  linkCustomerMutation.mutate({ leadId: linkLeadId, customerId: linkCustomerSelected.id });
                }
              }}
              data-testid="button-confirm-link-customer"
            >
              {linkCustomerMutation.isPending ? (
                <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" /> Linking…</span>
              ) : (
                <><Link2 className="w-3.5 h-3.5 mr-1.5" />Link Customer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule follow-up dialog — shown when a lead is marked as "Contacted" */}
      {fuLead && (
        <Dialog open={fuDialogOpen} onOpenChange={setFuDialogOpen}>
          <DialogContent className="max-w-sm" data-testid="modal-schedule-followup">
            <DialogHeader>
              <DialogTitle>Schedule a follow-up?</DialogTitle>
              <DialogDescription>
                You marked <strong>{(fuLead as any).name || (fuLead as any).email}</strong> as Contacted. Would you like to schedule a follow-up call?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-1">
              <div>
                <Label htmlFor="fu-date-lead">Follow-up date</Label>
                <Input
                  id="fu-date-lead"
                  type="date"
                  value={fuDate}
                  onChange={(e) => setFuDate(e.target.value)}
                  data-testid="input-followup-date"
                />
              </div>
              <div>
                <Label htmlFor="fu-notes-lead">Notes (optional)</Label>
                <Textarea
                  id="fu-notes-lead"
                  value={fuNotes}
                  onChange={(e) => setFuNotes(e.target.value)}
                  placeholder="What to follow up on..."
                  rows={2}
                  data-testid="textarea-followup-notes"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setFuDialogOpen(false)} data-testid="button-skip-followup">
                Skip
              </Button>
              <Button
                onClick={() => {
                  scheduleFollowUpMutation.mutate({
                    customerName: (fuLead as any).name || (fuLead as any).email || "Unknown",
                    customerPhone: (fuLead as any).phone || null,
                    customerEmail: (fuLead as any).email || null,
                    scheduledDate: fuDate,
                    notes: fuNotes || null,
                    leadId: fuLead.id,
                    assignedToUserId: user?.id || null,
                    assignedToName: user ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() || user.username : null,
                    assignedToEmail: user?.email || null,
                    createdBy: user?.username || "admin",
                  });
                }}
                disabled={!fuDate || scheduleFollowUpMutation.isPending}
                data-testid="button-confirm-followup"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule follow-up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
