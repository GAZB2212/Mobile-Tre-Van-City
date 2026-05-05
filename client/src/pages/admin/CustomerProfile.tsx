import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Mail, Phone, Building2, Pencil, Save, X,
  FileText, Bot, Users, CheckCircle2, Clock,
  CalendarDays, StickyNote, PhoneCall, Coffee, ExternalLink,
  AlertCircle, ChevronRight, Plus, Check,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  primaryStaffId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface CustomerNote {
  id: string;
  customerId: string;
  authorId?: string | null;
  authorName?: string | null;
  noteType: string;
  text: string;
  createdAt?: string | null;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  author?: string;
  timestamp: string;
  entityId?: string;
  entityType?: string;
}

interface HandoffData {
  currentStatus: string;
  lastContactAt?: string | null;
  lastNote?: { text?: string; author?: string; timestamp: string } | null;
  openFollowUps: Array<{ id: string; scheduledDate: string; notes?: string; assignedToName?: string }>;
}

interface CustomerProfileData {
  customer: Customer;
  leads: any[];
  quotes: any[];
  conversations: any[];
  followUps: any[];
  notes: CustomerNote[];
  timeline: TimelineEvent[];
  handoff: HandoffData;
}

const NOTE_TYPE_ICONS: Record<string, React.ElementType> = {
  call: PhoneCall,
  email: Mail,
  meeting: Coffee,
  general: StickyNote,
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  general: "General",
};

const TIMELINE_ICONS: Record<string, React.ElementType> = {
  lead_created: Users,
  lead_status_changed: CheckCircle2,
  quote_created: FileText,
  quote_status: CheckCircle2,
  chat_started: Bot,
  chat_completed: CheckCircle2,
  note: StickyNote,
  customer_note: StickyNote,
  followup_scheduled: CalendarDays,
  followup_completed: CheckCircle2,
};

const TIMELINE_COLORS: Record<string, string> = {
  lead_created: "bg-blue-500/20 text-blue-400",
  lead_status_changed: "bg-blue-500/20 text-blue-400",
  quote_created: "bg-purple-500/20 text-purple-400",
  quote_status: "bg-emerald-500/20 text-emerald-400",
  chat_started: "bg-cyan-500/20 text-cyan-400",
  chat_completed: "bg-emerald-500/20 text-emerald-400",
  note: "bg-amber-500/20 text-amber-400",
  customer_note: "bg-[hsl(86_45%_51%/0.15)] text-[hsl(86_53%_60%)]",
  followup_scheduled: "bg-orange-500/20 text-orange-400",
  followup_completed: "bg-emerald-500/20 text-emerald-400",
};

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    qualified: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    converted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    awaiting_deposit: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    deposit_taken: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    in_build: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
    closed: "bg-muted text-muted-foreground border-border",
    dead: "bg-red-500/15 text-red-400 border-red-500/30",
    unknown: "bg-muted text-muted-foreground border-border",
  };
  const label = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <Badge className={`text-[10px] border ${map[status] ?? map.unknown} no-default-active-elevate`}>
      {label}
    </Badge>
  );
}

export default function CustomerProfile() {
  const { id } = useParams();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };

  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");

  // Note form state
  type NoteType = "call" | "email" | "meeting" | "general";
  const [noteType, setNoteType] = useState<NoteType>("general");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  const { data, isLoading: profileLoading } = useQuery<CustomerProfileData>({
    queryKey: ["/api/admin/customers", id],
    queryFn: () =>
      fetch(`/api/admin/customers/${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!(user?.adminRole && user.adminRole !== "none") && !!id,
  });

  // Populate edit fields when data loads
  useEffect(() => {
    if (data?.customer) {
      setEditName(data.customer.name ?? "");
      setEditEmail(data.customer.email ?? "");
      setEditPhone(data.customer.phone ?? "");
      setEditCompany(data.customer.company ?? "");
    }
  }, [data?.customer]);

  const updateMutation = useMutation({
    mutationFn: (body: object) => apiRequest("PATCH", `/api/admin/customers/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      setEditing(false);
      toast({ title: "Customer updated" });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to update customer" }),
  });

  const addNoteMutation = useMutation({
    mutationFn: (body: object) => apiRequest("POST", `/api/admin/customers/${id}/notes`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", id] });
      setNoteText("");
      toast({ title: "Note added to customer and all linked records" });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to add note" }),
  });

  const handleSaveEdit = () => {
    updateMutation.mutate({
      name: editName.trim(),
      email: editEmail.trim() || null,
      phone: editPhone.trim() || null,
      company: editCompany.trim() || null,
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMutation.mutate({ noteType, text: noteText.trim() });
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Customer not found.</p>
      </div>
    );
  }

  const { customer, leads, quotes, conversations, notes, timeline, handoff } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 px-4 py-4">
        <div className="container mx-auto max-w-5xl">
          <Link href="/admin/customers">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3" data-testid="button-back-customers">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Customers
            </button>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[hsl(86_45%_51%/0.12)] flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-[hsl(86_53%_60%)]">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold" data-testid="text-customer-name">{customer.name}</h1>
                {customer.company && (
                  <p className="text-sm text-muted-foreground">{customer.company}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(!editing)}
              data-testid="button-edit-customer"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              {editing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: contact info + handoff card + notes form */}
          <div className="space-y-5">
            {/* Contact Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editing ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} data-testid="input-edit-name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" data-testid="input-edit-email" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} data-testid="input-edit-phone" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Company</Label>
                      <Input value={editCompany} onChange={e => setEditCompany(e.target.value)} data-testid="input-edit-company" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending} data-testid="button-save-customer">
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)} data-testid="button-cancel-edit">
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customer.email && (
                      <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm hover:text-foreground text-muted-foreground transition-colors" data-testid="link-customer-email">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </a>
                    )}
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm hover:text-foreground text-muted-foreground transition-colors" data-testid="link-customer-phone">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {customer.phone}
                      </a>
                    )}
                    {customer.company && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        {customer.company}
                      </div>
                    )}
                    {!customer.email && !customer.phone && !customer.company && (
                      <p className="text-xs text-muted-foreground italic">No contact details</p>
                    )}
                    <div className="pt-1 text-[11px] text-muted-foreground">
                      Customer since {formatDateShort(customer.createdAt)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Handoff Card */}
            <Card className="border-[hsl(86_53%_51%/0.25)] bg-[hsl(86_45%_51%/0.04)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[hsl(86_53%_60%)]" />
                  Staff Handoff
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">Current status</span>
                  <StatusBadge status={handoff.currentStatus} />
                </div>
                <div className="text-xs text-muted-foreground">
                  <span>Last contact: </span>
                  <span className="text-foreground">{formatDate(handoff.lastContactAt)}</span>
                </div>

                {handoff.lastNote ? (
                  <div className="rounded-md bg-card border border-border/60 p-2.5 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Last Note</p>
                    <p className="text-xs leading-relaxed">{handoff.lastNote.text}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {handoff.lastNote.author} · {formatDate(handoff.lastNote.timestamp)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No notes yet</p>
                )}

                {handoff.openFollowUps.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Open Follow-ups</p>
                    {handoff.openFollowUps.map(fu => (
                      <div key={fu.id} className="flex items-start gap-2 text-xs">
                        <CalendarDays className="w-3 h-3 mt-0.5 text-amber-400 shrink-0" />
                        <div>
                          <p className="font-medium">{formatDateShort(fu.scheduledDate)}</p>
                          {fu.notes && <p className="text-muted-foreground">{fu.notes}</p>}
                          {fu.assignedToName && <p className="text-muted-foreground">→ {fu.assignedToName}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Linked records */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Linked Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leads.map((l: any) => (
                  <Link key={l.id} href={`/admin/leads`} data-testid={`link-lead-${l.id}`}>
                    <div className="flex items-center justify-between rounded-md hover-elevate px-2.5 py-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <div>
                          <p className="text-xs font-medium">Lead · {l.source?.replace(/_/g, " ")}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDateShort(l.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={l.status ?? "new"} />
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
                {quotes.map((q: any) => (
                  <Link key={q.id} href={`/admin/quotes/${q.id}`} data-testid={`link-quote-${q.id}`}>
                    <div className="flex items-center justify-between rounded-md hover-elevate px-2.5 py-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <div>
                          <p className="text-xs font-medium">Quote · £{Math.round((q.est_total ?? 0) / 100).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDateShort(q.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={q.status ?? "new"} />
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
                {conversations.map((c: any) => (
                  <Link key={c.id} href={`/admin/ai-conversations?session=${c.session_id}`} data-testid={`link-convo-${c.id}`}>
                    <div className="flex items-center justify-between rounded-md hover-elevate px-2.5 py-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        <div>
                          <p className="text-xs font-medium">AI Chat · {c.status?.replace(/_/g, " ")}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDateShort(c.created_at)}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
                {leads.length === 0 && quotes.length === 0 && conversations.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No linked records yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: timeline + notes panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Add note form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  Add Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={noteType} onValueChange={v => setNoteType(v as NoteType)}>
                    <SelectTrigger data-testid="select-note-type" className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Note will be added to all linked leads and quotes automatically.
                  </p>
                </div>

                <Textarea
                  placeholder="Write a note..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="resize-none min-h-[80px]"
                  data-testid="textarea-note"
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                  data-testid="button-add-note"
                >
                  {addNoteMutation.isPending ? (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Save Note
                </Button>
              </CardContent>
            </Card>

            {/* Notes Panel */}
            {notes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <StickyNote className="w-3.5 h-3.5" />
                    Notes
                    <Badge className="ml-auto text-[10px] bg-muted text-muted-foreground no-default-active-elevate">
                      {notes.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notes.map(n => {
                    const NoteIcon = NOTE_TYPE_ICONS[n.noteType] ?? StickyNote;
                    return (
                      <div key={n.id} className="flex gap-3 group" data-testid={`note-item-${n.id}`}>
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <NoteIcon className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <Badge className="text-[10px] bg-muted text-muted-foreground no-default-active-elevate capitalize">
                              {NOTE_TYPE_LABELS[n.noteType] ?? n.noteType}
                            </Badge>
                            {n.authorName && (
                              <span className="text-[11px] text-muted-foreground">by {n.authorName}</span>
                            )}
                            <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                            </span>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{n.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Activity Timeline
                  <Badge className="ml-auto text-[10px] bg-muted text-muted-foreground no-default-active-elevate">
                    {timeline.length} events
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No activity recorded yet</p>
                ) : (
                  <div className="relative space-y-0">
                    {/* Vertical line */}
                    <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

                    {timeline.map((event, i) => {
                      const Icon = TIMELINE_ICONS[event.type] ?? StickyNote;
                      const colorClass = TIMELINE_COLORS[event.type] ?? "bg-muted text-muted-foreground";

                      return (
                        <div key={event.id} className="relative flex gap-3 pb-5" data-testid={`timeline-event-${i}`}>
                          {/* Icon bubble */}
                          <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-1.5">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium leading-tight">{event.title}</p>
                              <p className="text-[11px] text-muted-foreground shrink-0">{formatDate(event.timestamp)}</p>
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                                {event.description}
                              </p>
                            )}
                            {event.author && (
                              <p className="text-[11px] text-muted-foreground mt-1">by {event.author}</p>
                            )}
                            {(event.entityType === "quote" || event.entityType === "lead") && event.entityId && (
                              <Link
                                href={event.entityType === "quote" ? `/admin/quotes/${event.entityId}` : `/admin/leads`}
                                className="inline-flex items-center gap-1 text-[11px] text-[hsl(86_53%_60%)] hover:underline mt-1"
                              >
                                View {event.entityType} <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
