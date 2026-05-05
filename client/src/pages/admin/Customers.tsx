import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminBackButton } from "@/components/AdminBackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  ChevronRight,
  FileText,
  Bot,
  AlertCircle,
  UserCheck,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

interface StaffMember {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName: string;
}

interface CustomerListItem {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  primaryStaffId?: string | null;
  primaryStaffName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  leadCount: number;
  quoteCount: number;
  convoCount: number;
  openFollowUpCount: number;
  lastActivityAt?: string | null;
  pipelineStatus?: string | null;
}

interface LinkedCustomerSummary {
  id: string;
  name: string;
  isNew: boolean;
  leadsLinked: number;
  quotesLinked: number;
  convosLinked: number;
}

interface BackfillResult {
  ok: boolean;
  customersCreated: number;
  leadsLinked: number;
  quotesLinked: number;
  convosLinked: number;
  failedCount: number;
  linkedCustomers: LinkedCustomerSummary[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  contacted: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  qualified: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  converted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  awaiting_deposit: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  deposit_taken: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  in_build: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  closed: "bg-muted text-muted-foreground border-border",
  dead: "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminCustomers() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [syncSummary, setSyncSummary] = useState<BackfillResult | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Unauthorized", variant: "destructive" });
      setTimeout(() => { window.location.href = "/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (user && (!user.adminRole || user.adminRole === "none")) {
      toast({ title: "Access Denied", variant: "destructive" });
      setTimeout(() => { window.location.href = "/"; }, 1000);
    }
  }, [user, toast]);

  const { data: staffList = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/admin/staff"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const backfillMutation = useMutation<BackfillResult, Error>({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/customers/backfill").then((res) => res.json() as Promise<BackfillResult>),
    onSuccess: (data) => {
      const hasFailed = data.failedCount > 0;
      if (hasFailed) {
        toast({
          title: "Sync complete with errors",
          description: `${data.failedCount} record${data.failedCount !== 1 ? "s" : ""} could not be linked (see server logs).`,
          variant: "destructive",
        });
      }
      setSyncSummary(data);
      setSummaryExpanded(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
    },
    onError: () => {
      toast({ title: "Sync failed", description: "Could not run the backfill. Please try again.", variant: "destructive" });
    },
  });

  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (staffFilter) queryParams.set("staffId", staffFilter);
  const queryString = queryParams.toString();

  const queryKey = ["/api/admin/customers", debouncedSearch, staffFilter].filter(Boolean);

  const { data: customers = [], isLoading: customersLoading } = useQuery<CustomerListItem[]>({
    queryKey,
    queryFn: async () => {
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch(`/api/admin/customers${queryString ? `?${queryString}` : ""}`, {
        credentials: "include",
        headers,
      });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const hasFilters = !!debouncedSearch || !!staffFilter;

  const clearFilters = () => {
    setSearchTerm("");
    setStaffFilter("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.adminRole || user.adminRole === "none") return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Customers"
        description="Unified customer profiles across leads, quotes, and conversations"
      />

      <div className="container mx-auto px-4 py-6">
        <AdminBackButton />

        <div className="space-y-5">
          {/* Filters row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-customers"
              />
            </div>
            <Select value={staffFilter || "all"} onValueChange={v => setStaffFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-52" data-testid="select-staff-filter">
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staffList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Clear
              </Button>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {customersLoading ? "Loading..." : `${customers.length} customer${customers.length !== 1 ? "s" : ""}${hasFilters ? " found" : " total"}`}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => backfillMutation.mutate()}
              disabled={backfillMutation.isPending}
              data-testid="button-sync-customers"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${backfillMutation.isPending ? "animate-spin" : ""}`} />
              {backfillMutation.isPending ? "Syncing..." : "Sync Records"}
            </Button>
          </div>

          {/* Sync summary panel */}
          {syncSummary && (
            <Card data-testid="panel-sync-summary">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium">
                      {syncSummary.leadsLinked > 0 || syncSummary.quotesLinked > 0 || syncSummary.convosLinked > 0
                        ? "Sync complete"
                        : "Already up to date"}
                    </span>
                    {(syncSummary.customersCreated > 0 || syncSummary.leadsLinked > 0 || syncSummary.quotesLinked > 0 || syncSummary.convosLinked > 0) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {syncSummary.customersCreated > 0 && (
                          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/25 no-default-active-elevate">
                            {syncSummary.customersCreated} new customer{syncSummary.customersCreated !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {syncSummary.leadsLinked > 0 && (
                          <Badge className="text-[10px] bg-blue-500/15 text-blue-400 border-blue-500/25 no-default-active-elevate">
                            {syncSummary.leadsLinked} lead{syncSummary.leadsLinked !== 1 ? "s" : ""} linked
                          </Badge>
                        )}
                        {syncSummary.quotesLinked > 0 && (
                          <Badge className="text-[10px] bg-purple-500/15 text-purple-400 border-purple-500/25 no-default-active-elevate">
                            {syncSummary.quotesLinked} quote{syncSummary.quotesLinked !== 1 ? "s" : ""} linked
                          </Badge>
                        )}
                        {syncSummary.convosLinked > 0 && (
                          <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/25 no-default-active-elevate">
                            {syncSummary.convosLinked} chat{syncSummary.convosLinked !== 1 ? "s" : ""} linked
                          </Badge>
                        )}
                        {syncSummary.failedCount > 0 && (
                          <Badge className="text-[10px] bg-red-500/15 text-red-400 border-red-500/25 no-default-active-elevate">
                            <AlertCircle className="w-2.5 h-2.5 mr-1" />
                            {syncSummary.failedCount} failed
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {syncSummary.linkedCustomers.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSummaryExpanded(v => !v)}
                        data-testid="button-toggle-sync-summary"
                      >
                        {summaryExpanded ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                        {summaryExpanded ? "Hide" : "Show"} details
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSyncSummary(null)}
                      data-testid="button-dismiss-sync-summary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {summaryExpanded && syncSummary.linkedCustomers.length > 0 && (
                  <div className="mt-3 border-t pt-3 space-y-1.5">
                    <p className="text-xs text-muted-foreground mb-2">
                      Customer profiles updated by this sync:
                    </p>
                    {syncSummary.linkedCustomers.map(c => (
                      <div key={c.id} className="flex items-center justify-between gap-3 flex-wrap py-1" data-testid={`row-synced-customer-${c.id}`}>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/customers/${c.id}`}>
                            <span className="text-sm font-medium hover:underline cursor-pointer">{c.name}</span>
                          </Link>
                          {c.isNew && (
                            <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/25 no-default-active-elevate">
                              new
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {c.leadsLinked > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {c.leadsLinked} lead{c.leadsLinked !== 1 ? "s" : ""}
                            </span>
                          )}
                          {c.quotesLinked > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <FileText className="w-3 h-3" />
                              {c.quotesLinked} quote{c.quotesLinked !== 1 ? "s" : ""}
                            </span>
                          )}
                          {c.convosLinked > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Bot className="w-3 h-3" />
                              {c.convosLinked} chat{c.convosLinked !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {syncSummary.linkedCustomers.length === 0 && syncSummary.leadsLinked === 0 && syncSummary.quotesLinked === 0 && syncSummary.convosLinked === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">All records were already linked to customer profiles.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* List */}
          {customersLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading customers...</p>
              </CardContent>
            </Card>
          ) : customers.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                <p className="text-muted-foreground text-sm">
                  {hasFilters
                    ? "Try adjusting the filters."
                    : "Customers are created automatically when leads, quotes, or AI conversations are linked by email or phone."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {customers.map(c => (
                <Link key={c.id} href={`/admin/customers/${c.id}`} data-testid={`link-customer-${c.id}`}>
                  <Card className="hover-elevate cursor-pointer transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4 flex-wrap">
                        {/* Avatar / initials */}
                        <div className="w-9 h-9 rounded-full bg-[hsl(86_45%_51%/0.12)] flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-[hsl(86_53%_60%)]">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Main details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm" data-testid={`text-customer-name-${c.id}`}>{c.name}</span>
                            {c.company && (
                              <span className="text-xs text-muted-foreground">· {c.company}</span>
                            )}
                            {c.pipelineStatus && (
                              <Badge
                                className={`text-[10px] border no-default-active-elevate ${STATUS_COLORS[c.pipelineStatus] ?? STATUS_COLORS.new}`}
                                data-testid={`badge-status-${c.id}`}
                              >
                                {c.pipelineStatus.replace(/_/g, " ")}
                              </Badge>
                            )}
                            {c.openFollowUpCount > 0 && (
                              <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30 no-default-active-elevate">
                                <AlertCircle className="w-2.5 h-2.5 mr-1" />
                                {c.openFollowUpCount} follow-up{c.openFollowUpCount !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            {c.primaryStaffName && (
                              <Badge
                                className="text-[10px] bg-[hsl(86_45%_51%/0.12)] text-[hsl(86_53%_60%)] border-[hsl(86_53%_51%/0.25)] no-default-active-elevate"
                                data-testid={`badge-staff-${c.id}`}
                              >
                                <UserCheck className="w-2.5 h-2.5 mr-1" />
                                {c.primaryStaffName}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-1 flex-wrap">
                            {c.email && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3 shrink-0" />
                                {c.email}
                              </span>
                            )}
                            {c.phone && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3 shrink-0" />
                                {c.phone}
                              </span>
                            )}
                          </div>

                          {/* Record counts */}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {c.leadCount > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Users className="w-3 h-3" />
                                {c.leadCount} lead{c.leadCount !== 1 ? "s" : ""}
                              </span>
                            )}
                            {c.quoteCount > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <FileText className="w-3 h-3" />
                                {c.quoteCount} quote{c.quoteCount !== 1 ? "s" : ""}
                              </span>
                            )}
                            {c.convoCount > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Bot className="w-3 h-3" />
                                {c.convoCount} chat{c.convoCount !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side: last activity + arrow */}
                        <div className="flex items-center gap-3 shrink-0">
                          {c.lastActivityAt && (
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] text-muted-foreground">Last activity</p>
                              <p className="text-xs text-foreground">{formatDate(c.lastActivityAt)}</p>
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
