import { useAuth } from "@/hooks/useAuth";
import { useIdlePolling } from "@/hooks/useIdlePolling";
import type { User } from "@shared/schema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bot,
  MessageSquare,
  CheckCircle2,
  Percent,
  Phone,
  Download,
  Eye,
  PhoneCall,
  ExternalLink,
  Zap,
  Calendar,
} from "lucide-react";
import maxAvatarSrc from "@assets/max-avatar.png";

interface ConversationStats {
  totalThisMonth: number;
  completionRate: number;
  fortyEightVConversionRate: number;
  leadCaptureRate: number;
  leadsCapturedThisMonth: number;
}

interface AiConversationRow {
  id: string;
  session_id: string;
  status: string;
  van_type?: string;
  van_size?: string;
  spec_level?: string;
  finance_preference?: string;
  includes_48v?: boolean;
  was_48v_pitched?: boolean;
  response_to_48v?: string;
  config_completed?: boolean;
  marked_contacted?: boolean;
  created_at?: string;
  completed_at?: string;
  contact_name?: string;
  contact_phone?: string;
  linked_quote_id?: string;
  messages?: Array<{ role: string; content: string }>;
  mapped_config?: Record<string, unknown> | string;
}

interface AiConversationsResponse {
  conversations: AiConversationRow[];
  stats: ConversationStats;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "completed"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : status === "abandoned"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return (
    <Badge variant="secondary" className={`text-xs ${classes}`}>
      {status?.replace("_", " ")}
    </Badge>
  );
}

export default function AdminAIConversations() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };

  const [statusFilter, setStatusFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  const [v48Filter, setV48Filter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [transcriptConv, setTranscriptConv] = useState<AiConversationRow | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (user && (!user.adminRole || user.adminRole === "none")) {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [user, toast]);

  const isActive = useIdlePolling();

  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (v48Filter !== "all") params.set("includes48v", v48Filter);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", `${dateTo}T23:59:59`);

  const conversationsUrl = `/api/admin/ai-conversations${params.toString() ? `?${params}` : ""}`;

  const {
    data: aiData,
    isLoading: aiLoading,
    isFetching: aiFetching,
    refetch,
  } = useQuery<AiConversationsResponse>({
    queryKey: [conversationsUrl],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
    refetchInterval: isActive ? 60_000 : false,
    refetchIntervalInBackground: false,
  });

  const handleMarkContacted = async (id: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/ai-conversations/${id}/contacted`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-conversations"] });
      toast({ title: "Marked as contacted" });
    } catch {
      toast({ title: "Error", description: "Failed to mark as contacted.", variant: "destructive" });
    }
  };

  const handleExportCsv = async () => {
    try {
      const r = await apiRequest("GET", "/api/admin/ai-conversations/export/csv");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-conversations.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "Failed to export CSV.", variant: "destructive" });
    }
  };

  const handleViewTranscript = async (conv: AiConversationRow) => {
    try {
      const r = await apiRequest("GET", `/api/admin/ai-conversations/${conv.id}`);
      const data = await r.json();
      setTranscriptConv(data);
    } catch {
      toast({ title: "Error", description: "Failed to load transcript.", variant: "destructive" });
    }
  };

  const visibleConversations = (aiData?.conversations ?? []).filter((conv) => {
    const hasContact = !!(conv.contact_name || conv.contact_phone);
    if (contactFilter === "with_contact" && !hasContact) return false;
    if (contactFilter === "no_contact" && hasContact) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const nameMatch = conv.contact_name?.toLowerCase().includes(q) ?? false;
      const phoneMatch = conv.contact_phone?.toLowerCase().includes(q) ?? false;
      if (!nameMatch && !phoneMatch) return false;
    }
    return true;
  });

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="w-6 h-6" />
                Max AI Conversations
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Review all AI chat sessions from the Max van builder widget
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      aiFetching
                        ? "bg-amber-400 animate-pulse"
                        : isActive
                        ? "bg-green-500"
                        : "bg-muted-foreground"
                    }`}
                  />
                  {aiFetching
                    ? "Refreshing…"
                    : isActive
                    ? "Live — updates every 60s"
                    : "Paused (idle)"}
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportCsv}
              data-testid="button-export-ai-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Sessions (this month)</p>
                <p className="text-2xl font-bold" data-testid="stat-ai-total">
                  {aiData?.stats?.totalThisMonth ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Completion rate</p>
                <p className="text-2xl font-bold" data-testid="stat-ai-completion">
                  {aiData?.stats?.completionRate ?? 0}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Percent className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">48V conversion</p>
                <p className="text-2xl font-bold" data-testid="stat-ai-48v">
                  {aiData?.stats?.fortyEightVConversionRate ?? 0}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Leads captured</p>
                <p className="text-2xl font-bold" data-testid="stat-ai-leads">
                  {aiData?.stats?.leadsCapturedThisMonth ?? 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({aiData?.stats?.leadCaptureRate ?? 0}%)
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card data-testid="card-ai-filters">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
            <Input
              type="search"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-ai-conversations"
            />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              <Select value={contactFilter} onValueChange={setContactFilter}>
                <SelectTrigger data-testid="select-ai-contact">
                  <SelectValue placeholder="Contact details" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conversations</SelectItem>
                  <SelectItem value="with_contact">Has contact details</SelectItem>
                  <SelectItem value="no_contact">Anonymous only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={v48Filter} onValueChange={setV48Filter}>
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
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From date"
                data-testid="input-ai-date-from"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To date"
                data-testid="input-ai-date-to"
              />
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversations list */}
        {aiLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading conversations...</p>
            </CardContent>
          </Card>
        ) : visibleConversations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversations found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== "all" ||
                contactFilter !== "all" ||
                v48Filter !== "all" ||
                dateFrom ||
                dateTo ||
                searchQuery.trim()
                  ? "Try adjusting your filters to see more sessions."
                  : "AI van builder conversations will appear here once customers use the chat widget."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {visibleConversations.map((conv) => (
              <Card
                key={conv.id}
                data-testid={`card-ai-conv-${conv.id}`}
                className={conv.contact_name || conv.contact_phone ? "border-[#8bc440]/30" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start gap-4 justify-between">
                    {/* Left: identity + meta */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-border shrink-0">
                        <img
                          src={maxAvatarSrc}
                          alt="Max"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0">
                        {/* Name + phone */}
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span
                            className="font-semibold text-sm"
                            data-testid={`text-ai-name-${conv.id}`}
                          >
                            {conv.contact_name ?? "Anonymous"}
                          </span>
                          {(conv.contact_name || conv.contact_phone) && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-[#8bc440]/15 text-[#8bc440]"
                            >
                              Contact captured
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <StatusBadge status={conv.status} />
                          {conv.includes_48v && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-[#8bc440]/15 text-[#8bc440]"
                            >
                              48V
                            </Badge>
                          )}
                          {conv.config_completed && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-500/15 text-green-400 border-green-500/30"
                            >
                              Config complete
                            </Badge>
                          )}
                          {conv.marked_contacted && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-muted text-muted-foreground"
                            >
                              Contacted
                            </Badge>
                          )}
                        </div>
                        {/* Config summary */}
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {conv.van_size && <span>Size: {conv.van_size}</span>}
                          {conv.van_type && <span>Type: {conv.van_type}</span>}
                          {conv.spec_level && <span>Pack: {conv.spec_level}</span>}
                          {conv.finance_preference && (
                            <span>Finance: {conv.finance_preference}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(conv.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex flex-wrap gap-2 justify-end">
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
                      {conv.contact_phone && (
                        <a
                          href={`tel:${conv.contact_phone}`}
                          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-[#8bc440] transition-colors"
                          data-testid={`link-ai-phone-${conv.id}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-[#8bc440]" />
                          {conv.contact_phone}
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Transcript dialog */}
      <Dialog
        open={!!transcriptConv}
        onOpenChange={(open) => !open && setTranscriptConv(null)}
      >
        <DialogContent
          className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0"
          data-testid="dialog-transcript"
        >
          <DialogTitle className="sr-only">
            Chat transcript — {transcriptConv?.contact_name ?? "Anonymous"}
          </DialogTitle>

          {/* Dialog header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#8bc440]/30 shrink-0">
              <img
                src={maxAvatarSrc}
                alt="Max"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-none">
                Max — Chat with {transcriptConv?.contact_name ?? "Anonymous"}
              </p>
              {transcriptConv?.contact_phone && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {transcriptConv.contact_phone}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {transcriptConv?.includes_48v && (
                <Badge
                  className="text-xs bg-[#8bc440]/15 text-[#8bc440] border-[#8bc440]/30"
                  variant="outline"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  48V
                </Badge>
              )}
              {transcriptConv?.status && (
                <StatusBadge status={transcriptConv.status} />
              )}
            </div>
          </div>

          {/* Config summary in dialog */}
          {transcriptConv?.mapped_config &&
            (() => {
              const cfg =
                typeof transcriptConv.mapped_config === "string"
                  ? JSON.parse(transcriptConv.mapped_config)
                  : transcriptConv.mapped_config;
              const hasSummary =
                cfg.serviceType ||
                cfg.vanSize ||
                cfg.machineType ||
                cfg.kitId ||
                cfg.packageId ||
                cfg.financePreference;
              if (!hasSummary) return null;
              return (
                <div className="px-5 py-3 bg-muted/40 border-b shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Captured configuration
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cfg.packageId && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {cfg.packageId} package
                      </Badge>
                    )}
                    {cfg.serviceType && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {cfg.serviceType === "hybrid"
                          ? "Cars + Commercials"
                          : cfg.serviceType === "commercial"
                          ? "Commercials"
                          : "Cars & vans"}
                      </Badge>
                    )}
                    {cfg.vanSize && (
                      <Badge variant="outline" className="text-xs">
                        {cfg.vanSize}
                      </Badge>
                    )}
                    {cfg.machineType && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {cfg.machineType.replace("-", " ")}
                      </Badge>
                    )}
                    {cfg.kitId && (
                      <Badge variant="outline" className="text-xs">
                        Kit: {cfg.kitId}
                      </Badge>
                    )}
                    {cfg.financePreference && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {cfg.financePreference}
                      </Badge>
                    )}
                    {cfg.includes48v && (
                      <Badge
                        variant="outline"
                        className="text-xs text-[#8bc440] border-[#8bc440]/30"
                      >
                        48V system
                      </Badge>
                    )}
                    {cfg.ownVan === false && (
                      <Badge variant="outline" className="text-xs">
                        Needs van supplied
                      </Badge>
                    )}
                    {cfg.ownVan === true && (
                      <Badge variant="outline" className="text-xs">
                        Own van
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {(transcriptConv?.messages ?? []).map(
              (m: { role: string; content: string }, i: number) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-0.5">
                      <img
                        src={maxAvatarSrc}
                        alt="Max"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#8bc440] text-[#191919] rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              )
            )}
            {!transcriptConv?.messages?.length && (
              <p className="text-muted-foreground text-sm text-center py-8">
                No messages recorded for this session
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
