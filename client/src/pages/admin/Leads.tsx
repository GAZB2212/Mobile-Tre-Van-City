import { useAuth } from "@/hooks/useAuth";
import { useIdlePolling } from "@/hooks/useIdlePolling";
import type { User, Lead } from "@shared/schema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AdminBackButton } from "@/components/AdminBackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CheckCircle2,
  XCircle,
  Percent,
  Eye,
  PhoneCall,
  Zap,
  Bot,
} from "lucide-react";
import maxAvatarSrc from "@assets/max-avatar.png";

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

  const isActive = useIdlePolling();

  const { data: leads = [], isLoading: leadsLoading, error: leadsError, isFetching: leadsFetching } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
    refetchInterval: isActive ? 60_000 : false,
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

  // ─── AI Conversations ────────────────────────────────────────────────────────
  const [aiStatusFilter, setAiStatusFilter] = useState("all");
  const [ai48vFilter, setAi48vFilter] = useState("all");
  const [aiDateFrom, setAiDateFrom] = useState("");
  const [aiDateTo, setAiDateTo] = useState("");
  const [transcriptConv, setTranscriptConv] = useState<any>(null);

  const aiConvParams = new URLSearchParams();
  if (aiStatusFilter !== "all") aiConvParams.set("status", aiStatusFilter);
  if (ai48vFilter !== "all") aiConvParams.set("includes48v", ai48vFilter);
  if (aiDateFrom) aiConvParams.set("dateFrom", aiDateFrom);
  if (aiDateTo) aiConvParams.set("dateTo", aiDateTo);

  const { data: aiData, isLoading: aiLoading, refetch: refetchAi } = useQuery<{
    conversations: any[];
    stats: { totalThisMonth: number; completionRate: number; fortyEightVConversionRate: number; leadCaptureRate: number };
  }>({
    queryKey: ["/api/admin/ai-conversations", aiStatusFilter, ai48vFilter, aiDateFrom, aiDateTo],
    queryFn: async () => {
      const r = await fetch(`/api/admin/ai-conversations?${aiConvParams}`);
      return r.json();
    },
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const handleMarkContacted = async (id: string) => {
    await fetch(`/api/admin/ai-conversations/${id}/contacted`, { method: "PATCH" });
    refetchAi();
    toast({ title: "Marked as contacted" });
  };

  const handleExportAiCsv = () => {
    window.open("/api/admin/ai-conversations/export/csv", "_blank");
  };

  const handleViewTranscript = async (conv: any) => {
    const r = await fetch(`/api/admin/ai-conversations/${conv.id}`);
    const data = await r.json();
    setTranscriptConv(data);
  };

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
                  <span className={`w-1.5 h-1.5 rounded-full ${leadsFetching ? "bg-amber-400 animate-pulse" : isActive ? "bg-green-500" : "bg-muted-foreground"}`} />
                  {leadsFetching ? "Refreshing…" : isActive ? "Live — updates every 60s" : "Paused (idle)"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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

      <div className="container mx-auto px-4 py-6">
        <AdminBackButton />

        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList data-testid="tabs-leads">
            <TabsTrigger value="leads" data-testid="tab-form-leads">
              <Users className="w-4 h-4 mr-1.5" />
              Form Leads
            </TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai-conversations">
              <Bot className="w-4 h-4 mr-1.5" />
              AI Conversations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
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
                  placeholder="Search by name, email, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-leads"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <Card key={lead.id} data-testid={`card-lead-${lead.id}`} className={status === 'dead' ? 'opacity-60' : ''}>
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
          </TabsContent>

          {/* ─── AI Conversations Tab ─── */}
          <TabsContent value="ai" className="space-y-6">
            {/* Headline stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Conversations (month)</p>
                    <p className="text-2xl font-bold" data-testid="stat-ai-total">{aiData?.stats.totalThisMonth ?? 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completion rate</p>
                    <p className="text-2xl font-bold" data-testid="stat-ai-completion">{aiData?.stats.completionRate ?? 0}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Percent className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">48V conversion rate</p>
                    <p className="text-2xl font-bold" data-testid="stat-ai-48v">{aiData?.stats.fortyEightVConversionRate ?? 0}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lead capture rate</p>
                    <p className="text-2xl font-bold" data-testid="stat-ai-leads">{aiData?.stats.leadCaptureRate ?? 0}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">AI Van Builder Conversations</CardTitle>
                  <Button size="sm" variant="outline" onClick={handleExportAiCsv} data-testid="button-export-ai-csv">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Select value={aiStatusFilter} onValueChange={setAiStatusFilter}>
                    <SelectTrigger data-testid="select-ai-status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="abandoned">Abandoned</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ai48vFilter} onValueChange={setAi48vFilter}>
                    <SelectTrigger data-testid="select-ai-48v">
                      <SelectValue placeholder="48V filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (48V)</SelectItem>
                      <SelectItem value="true">48V included</SelectItem>
                      <SelectItem value="false">No 48V</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={aiDateFrom}
                    onChange={e => setAiDateFrom(e.target.value)}
                    placeholder="From date"
                    data-testid="input-ai-date-from"
                  />
                  <Input
                    type="date"
                    value={aiDateTo}
                    onChange={e => setAiDateTo(e.target.value)}
                    placeholder="To date"
                    data-testid="input-ai-date-to"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Conversations table */}
            {aiLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading conversations...</p>
                </CardContent>
              </Card>
            ) : !aiData?.conversations?.length ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground">AI van builder conversations will appear here once customers start using the chat widget.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {aiData.conversations.map((conv: any) => (
                  <Card key={conv.id} data-testid={`card-ai-conv-${conv.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start gap-4 justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-border shrink-0">
                            <img src={maxAvatarSrc} alt="Max" className="w-full h-full object-cover object-top" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-sm" data-testid={`text-ai-name-${conv.id}`}>
                                {conv.contact_name ?? "Anonymous"}
                              </span>
                              {conv.contact_phone && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" />{conv.contact_phone}
                                </span>
                              )}
                              <Badge variant="secondary" className={`text-xs ${
                                conv.status === "completed" ? "bg-green-500/15 text-green-400 border-green-500/30" :
                                conv.status === "abandoned" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                                "bg-blue-500/15 text-blue-400 border-blue-500/30"
                              }`}>
                                {conv.status?.replace("_", " ")}
                              </Badge>
                              {conv.includes_48v && (
                                <Badge variant="secondary" className="text-xs bg-[#8bc440]/15 text-[#8bc440]">48V</Badge>
                              )}
                              {conv.marked_contacted && (
                                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Contacted</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                              {conv.van_size && <span>Van: {conv.van_size}</span>}
                              {conv.van_type && <span>Service: {conv.van_type}</span>}
                              {conv.finance_preference && <span>Finance: {conv.finance_preference}</span>}
                              <span>{formatDate(conv.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewTranscript(conv)}
                            data-testid={`button-view-transcript-${conv.id}`}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Transcript
                          </Button>
                          {conv.linked_quote_id && (
                            <Link href={`/admin/quotes/${conv.linked_quote_id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-view-quote-${conv.id}`}
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                View Quote
                              </Button>
                            </Link>
                          )}
                          {!conv.marked_contacted && conv.contact_phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkContacted(conv.id)}
                              data-testid={`button-mark-contacted-${conv.id}`}
                            >
                              <PhoneCall className="w-3.5 h-3.5 mr-1" />
                              Mark contacted
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Transcript modal */}
      <Dialog open={!!transcriptConv} onOpenChange={open => !open && setTranscriptConv(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0" data-testid="dialog-transcript">
          <DialogTitle className="sr-only">
            Chat transcript — {transcriptConv?.contact_name ?? "Anonymous"}
          </DialogTitle>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#8bc440]/30 shrink-0">
              <img src={maxAvatarSrc} alt="Max" className="w-full h-full object-cover object-top" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-none">
                Max — Chat with {transcriptConv?.contact_name ?? "Anonymous"}
              </p>
              {transcriptConv?.contact_phone && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" />{transcriptConv.contact_phone}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {transcriptConv?.includes_48v && (
                <Badge className="text-xs bg-[#8bc440]/15 text-[#8bc440] border-[#8bc440]/30" variant="outline">
                  <Zap className="w-3 h-3 mr-1" />48V
                </Badge>
              )}
              <Badge variant="secondary" className={`text-xs ${
                transcriptConv?.status === "completed" ? "bg-green-500/15 text-green-400" :
                transcriptConv?.status === "abandoned" ? "bg-amber-500/15 text-amber-400" :
                "bg-blue-500/15 text-blue-400"
              }`}>
                {transcriptConv?.status?.replace("_", " ")}
              </Badge>
            </div>
          </div>

          {/* Captured spec summary */}
          {transcriptConv?.mapped_config && (() => {
            const cfg = typeof transcriptConv.mapped_config === "string"
              ? JSON.parse(transcriptConv.mapped_config)
              : transcriptConv.mapped_config;
            const hasSummary = cfg.serviceType || cfg.vanSize || cfg.machineType || cfg.kitId || cfg.packageId || cfg.financePreference;
            if (!hasSummary) return null;
            return (
              <div className="px-5 py-3 bg-muted/40 border-b shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Captured configuration</p>
                <div className="flex flex-wrap gap-2">
                  {cfg.packageId && (
                    <Badge variant="outline" className="text-xs capitalize">{cfg.packageId} package</Badge>
                  )}
                  {cfg.serviceType && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {cfg.serviceType === "hybrid" ? "Cars + Commercials" : cfg.serviceType === "commercial" ? "Commercials" : "Cars & vans"}
                    </Badge>
                  )}
                  {cfg.vanSize && <Badge variant="outline" className="text-xs">{cfg.vanSize}</Badge>}
                  {cfg.machineType && (
                    <Badge variant="outline" className="text-xs capitalize">{cfg.machineType.replace("-", " ")}</Badge>
                  )}
                  {cfg.kitId && <Badge variant="outline" className="text-xs">Kit: {cfg.kitId}</Badge>}
                  {cfg.financePreference && (
                    <Badge variant="outline" className="text-xs capitalize">{cfg.financePreference}</Badge>
                  )}
                  {cfg.includes48v && (
                    <Badge variant="outline" className="text-xs text-[#8bc440] border-[#8bc440]/30">48V system</Badge>
                  )}
                  {cfg.ownVan === false && <Badge variant="outline" className="text-xs">Needs van supplied</Badge>}
                  {cfg.ownVan === true && <Badge variant="outline" className="text-xs">Own van</Badge>}
                </div>
              </div>
            );
          })()}

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {(transcriptConv?.messages ?? []).map((m: any, i: number) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-0.5">
                    <img src={maxAvatarSrc} alt="Max" className="w-full h-full object-cover object-top" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#8bc440] text-[#191919] rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {(!transcriptConv?.messages?.length) && (
              <p className="text-muted-foreground text-sm text-center py-8">No messages recorded for this session</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
