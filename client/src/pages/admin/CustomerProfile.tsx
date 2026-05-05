import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getAuthToken } from "@/lib/queryClient";
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
  AlertCircle, ChevronRight, Plus, Check, UserCheck, UserX, ArrowRightLeft,
  Merge, Search, ShieldAlert, Scissors, UserCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface StaffMember {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName: string;
}

interface MergeHistoryEntry {
  id: string;
  keepId: string;
  keepSnapshotName: string | null;
  keepSnapshotEmail: string | null;
  keepSnapshotPhone: string | null;
  keepSnapshotCompany: string | null;
  removedId: string;
  removedSnapshotName: string | null;
  removedSnapshotEmail: string | null;
  removedSnapshotPhone: string | null;
  removedSnapshotCompany: string | null;
  leadsRelinked: string[];
  quotesRelinked: string[];
  conversationsRelinked: string[];
  notesRelinked: string[];
  triggeredBy: string | null;
  mergedAt: string | null;
  splitAt: string | null;
}

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  primaryStaffId?: string | null;
  primaryStaffName?: string | null;
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
  record_reassigned_in: ArrowRightLeft,
  record_reassigned_out: ArrowRightLeft,
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
  record_reassigned_in: "bg-violet-500/20 text-violet-400",
  record_reassigned_out: "bg-slate-500/20 text-slate-400",
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
  const [editPrimaryStaffId, setEditPrimaryStaffId] = useState<string | null>(null);

  // Note form state
  type NoteType = "call" | "email" | "meeting" | "general";
  const [noteType, setNoteType] = useState<NoteType>("general");
  const [noteText, setNoteText] = useState("");

  const mergeRedirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (mergeRedirectTimer.current !== null) {
        clearTimeout(mergeRedirectTimer.current);
      }
    };
  }, []);

  // Manual merge state
  const [showMergePanel, setShowMergePanel] = useState(false);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeSearchInput, setMergeSearchInput] = useState("");
  const [selectedMergeTarget, setSelectedMergeTarget] = useState<{ id: string; name: string; email?: string | null; phone?: string | null } | null>(null);
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [mergeKeepId, setMergeKeepId] = useState<string | null>(null);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  const { data, isLoading: profileLoading } = useQuery<CustomerProfileData>({
    queryKey: ["/api/admin/customers", id],
    queryFn: async () => {
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch(`/api/admin/customers/${id}`, { credentials: "include", headers });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
    enabled: !!(user?.adminRole && user.adminRole !== "none") && !!id,
  });

  const { data: staffList = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/admin/staff"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  // Debounce merge search input
  useEffect(() => {
    const timer = setTimeout(() => setMergeSearch(mergeSearchInput), 350);
    return () => clearTimeout(timer);
  }, [mergeSearchInput]);

  const { data: mergeSearchResults = [], isFetching: mergeSearchFetching } = useQuery<Array<{ id: string; name: string; email?: string | null; phone?: string | null }>>({
    queryKey: ["/api/admin/customers", { search: mergeSearch }],
    queryFn: async () => {
      if (!mergeSearch.trim()) return [];
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch(`/api/admin/customers?search=${encodeURIComponent(mergeSearch.trim())}`, { credentials: "include", headers });
      if (!r.ok) throw new Error(`${r.status}`);
      const all = await r.json();
      return (all as Array<{ id: string; name: string; email?: string | null; phone?: string | null }>).filter(c => c.id !== id);
    },
    enabled: !!(user?.adminRole && user.adminRole !== "none") && showMergePanel && mergeSearch.trim().length > 0,
  });

  const { data: mergeHistory = [], isLoading: mergeHistoryLoading } = useQuery<MergeHistoryEntry[]>({
    queryKey: ["/api/admin/customers/merge-history", id],
    queryFn: async () => {
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch(`/api/admin/customers/merge-history?keepId=${encodeURIComponent(id ?? "")}`, { credentials: "include", headers });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
    enabled: !!(user?.adminRole && user.adminRole !== "none") && !!id,
  });

  const splitMutation = useMutation<{ ok: boolean; newCustomerId: string }, Error, string>({
    mutationFn: (historyId: string) =>
      apiRequest("POST", `/api/admin/customers/split/${historyId}`).then((res) => res.json()),
    onSuccess: () => {
      setSplittingId(null);
      toast({
        title: "Merge reversed",
        description: "The customer has been recreated and their records re-linked.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers/merge-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", id] });
    },
    onError: (err) => {
      setSplittingId(null);
      let msg = "Could not reverse the merge. Please try again.";
      if (err.message?.includes("already been split")) {
        msg = "This merge has already been reversed.";
      } else if (err.message?.includes("email or phone already exists")) {
        msg = "A customer with that email/phone already exists. This split cannot be completed.";
      }
      toast({ title: "Split failed", description: msg, variant: "destructive" });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: ({ mergeWithId, keepId }: { mergeWithId: string; keepId: string }) =>
      apiRequest("POST", `/api/admin/customers/${id}/merge`, { mergeWithId, keepId }).then(r => r.json()),
    onSuccess: (result: { ok: boolean; survivingId: string }) => {
      setShowMergeConfirm(false);
      setShowMergePanel(false);
      const isCurrentRemoved = result.survivingId !== id;
      const survivingName = isCurrentRemoved ? selectedMergeTarget?.name : null;
      setSelectedMergeTarget(null);
      setMergeSearchInput("");
      setMergeSearch("");
      setMergeKeepId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers/merge-history"] });
      if (isCurrentRemoved) {
        toast({
          title: "Profile merged",
          description: `This profile has been merged into ${survivingName ?? "the other customer"} — redirecting…`,
        });
        mergeRedirectTimer.current = setTimeout(() => {
          mergeRedirectTimer.current = null;
          navigate(`/admin/customers/${result.survivingId}`);
        }, 1500);
      } else {
        toast({ title: "Customers merged", description: "The merge has been logged and can be reversed from the Merge History panel." });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", id] });
      }
    },
    onError: () => toast({ variant: "destructive", title: "Merge failed", description: "Could not merge the customers. Please try again." }),
  });

  const handleMergeConfirm = () => {
    if (!selectedMergeTarget || !mergeKeepId) return;
    mergeMutation.mutate({ mergeWithId: selectedMergeTarget.id, keepId: mergeKeepId });
  };

  // Populate edit fields when data loads
  useEffect(() => {
    if (data?.customer) {
      setEditName(data.customer.name ?? "");
      setEditEmail(data.customer.email ?? "");
      setEditPhone(data.customer.phone ?? "");
      setEditCompany(data.customer.company ?? "");
      setEditPrimaryStaffId(data.customer.primaryStaffId ?? null);
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
      primaryStaffId: editPrimaryStaffId || null,
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMutation.mutate({ noteType, text: noteText.trim() });
  };

  const handleAssignToMe = () => {
    if (!user?.id) return;
    updateMutation.mutate({ primaryStaffId: user.id });
  };

  const handleUnassign = () => {
    updateMutation.mutate({ primaryStaffId: null });
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
  const isAssignedToMe = customer.primaryStaffId === user?.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 px-4 py-4">
        <div className="w-full">
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

      {/* Status summary bar */}
      <div className="border-b bg-card/30 px-4 py-3">
        <div className="w-full flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Status</span>
            <StatusBadge status={handoff.currentStatus} />
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Owner:</span>
            <span className="text-xs font-medium" data-testid="text-status-bar-owner">
              {customer.primaryStaffName ?? "Unassigned"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Last contact:</span>
            <span className="text-xs font-medium" data-testid="text-status-bar-last-contact">
              {handoff.lastContactAt ? formatDate(handoff.lastContactAt) : "Never"}
            </span>
          </div>
          {handoff.openFollowUps.length > 0 && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs text-muted-foreground">Next action:</span>
              <span className="text-xs font-medium text-amber-400" data-testid="text-status-bar-next-action">
                {formatDateShort(handoff.openFollowUps[0].scheduledDate)}
              </span>
              {handoff.openFollowUps[0].notes && (
                <span className="text-xs text-muted-foreground truncate max-w-[180px] hidden sm:inline">
                  — {handoff.openFollowUps[0].notes}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {customer.phone && (
              <Button variant="outline" size="sm" asChild data-testid="button-quick-call">
                <a href={`tel:${customer.phone}`}>
                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                  Call
                </a>
              </Button>
            )}
            {customer.email && (
              <Button variant="outline" size="sm" asChild data-testid="button-quick-email">
                <a href={`mailto:${customer.email}`}>
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Email
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-6">
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
                    <div className="space-y-1">
                      <Label className="text-xs">Assigned Staff</Label>
                      <Select
                        value={editPrimaryStaffId ?? "none"}
                        onValueChange={v => setEditPrimaryStaffId(v === "none" ? null : v)}
                      >
                        <SelectTrigger data-testid="select-assigned-staff">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {staffList.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                {/* Assigned Staff */}
                <div className="rounded-md bg-card border border-border/60 p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[hsl(86_53%_60%)] shrink-0" />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Owner</span>
                    </div>
                    {customer.primaryStaffId && (
                      <button
                        onClick={handleUnassign}
                        disabled={updateMutation.isPending}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        data-testid="button-unassign-staff"
                      >
                        <UserX className="w-3 h-3" />
                        Unassign
                      </button>
                    )}
                  </div>
                  {customer.primaryStaffName ? (
                    <p className="text-sm font-semibold text-foreground" data-testid="text-assigned-staff">
                      {customer.primaryStaffName}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Unassigned</p>
                  )}
                  {!isAssignedToMe && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAssignToMe}
                      disabled={updateMutation.isPending}
                      className="w-full"
                      data-testid="button-assign-to-me"
                    >
                      {updateMutation.isPending ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Assign to me
                    </Button>
                  )}
                  {isAssignedToMe && (
                    <p className="text-[11px] text-[hsl(86_53%_60%)] flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Assigned to you
                    </p>
                  )}
                </div>

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

            {/* Merge with another customer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Merge className="w-3.5 h-3.5" />
                  Merge Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showMergePanel ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Combine this customer with a duplicate record. All linked leads, quotes, and conversations will be reassigned to the surviving customer, and the merge can be reversed from the Merge History panel.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowMergePanel(true)}
                      data-testid="button-open-merge-panel"
                    >
                      <Merge className="w-3.5 h-3.5 mr-1.5" />
                      Merge with another customer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Search by name, email or phone..."
                        value={mergeSearchInput}
                        onChange={e => {
                          setMergeSearchInput(e.target.value);
                          setSelectedMergeTarget(null);
                          setMergeKeepId(null);
                        }}
                        className="pl-8 text-sm"
                        data-testid="input-merge-search"
                      />
                    </div>

                    {/* Search results */}
                    {mergeSearch.trim().length > 0 && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {mergeSearchFetching ? (
                          <p className="text-xs text-muted-foreground text-center py-3">Searching...</p>
                        ) : mergeSearchResults.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-3 italic">No other customers found</p>
                        ) : (
                          mergeSearchResults.map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedMergeTarget(c);
                                setMergeKeepId(id ?? null);
                              }}
                              className={`w-full text-left rounded-md px-2.5 py-2 hover-elevate transition-colors ${selectedMergeTarget?.id === c.id ? "bg-muted" : ""}`}
                              data-testid={`button-select-merge-target-${c.id}`}
                            >
                              <p className="text-xs font-medium truncate">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {[c.email, c.phone].filter(Boolean).join(" · ") || "No contact details"}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {/* Keep which customer choice */}
                    {selectedMergeTarget && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Keep which record?</p>
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setMergeKeepId(id ?? null)}
                            className={`w-full text-left rounded-md border px-2.5 py-2 transition-colors ${mergeKeepId === id ? "border-[hsl(86_53%_51%/0.5)] bg-[hsl(86_45%_51%/0.08)]" : "border-border hover-elevate"}`}
                            data-testid="button-keep-current"
                          >
                            <div className="flex items-center gap-1.5">
                              {mergeKeepId === id && <Check className="w-3 h-3 text-[hsl(86_53%_60%)] shrink-0" />}
                              <p className="text-xs font-medium truncate">{data?.customer.name} <span className="text-muted-foreground font-normal">(this profile)</span></p>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate ml-4.5">
                              {[data?.customer.email, data?.customer.phone].filter(Boolean).join(" · ") || "No contact details"}
                            </p>
                          </button>
                          <button
                            onClick={() => setMergeKeepId(selectedMergeTarget.id)}
                            className={`w-full text-left rounded-md border px-2.5 py-2 transition-colors ${mergeKeepId === selectedMergeTarget.id ? "border-[hsl(86_53%_51%/0.5)] bg-[hsl(86_45%_51%/0.08)]" : "border-border hover-elevate"}`}
                            data-testid="button-keep-other"
                          >
                            <div className="flex items-center gap-1.5">
                              {mergeKeepId === selectedMergeTarget.id && <Check className="w-3 h-3 text-[hsl(86_53%_60%)] shrink-0" />}
                              <p className="text-xs font-medium truncate">{selectedMergeTarget.name}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {[selectedMergeTarget.email, selectedMergeTarget.phone].filter(Boolean).join(" · ") || "No contact details"}
                            </p>
                          </button>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => setShowMergeConfirm(true)}
                          disabled={!mergeKeepId}
                          data-testid="button-merge-confirm-open"
                        >
                          <Merge className="w-3.5 h-3.5 mr-1.5" />
                          Merge customers
                        </Button>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowMergePanel(false);
                        setSelectedMergeTarget(null);
                        setMergeSearchInput("");
                        setMergeSearch("");
                        setMergeKeepId(null);
                      }}
                      data-testid="button-cancel-merge"
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Merge History — only shown when there are entries for this customer */}
            {(mergeHistoryLoading || mergeHistory.length > 0) && (
              <Card data-testid="panel-merge-history-profile">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Merge History</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {mergeHistoryLoading ? (
                    <div className="flex items-center gap-2 py-3 justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mergeHistory.map((entry) => {
                        const recordCount =
                          (entry.leadsRelinked?.length ?? 0) +
                          (entry.quotesRelinked?.length ?? 0) +
                          (entry.conversationsRelinked?.length ?? 0) +
                          (entry.notesRelinked?.length ?? 0);
                        const alreadySplit = !!entry.splitAt;
                        const isSplitting = splittingId === entry.id;
                        return (
                          <div
                            key={entry.id}
                            className="py-3 border-t first:border-t-0 space-y-1.5"
                            data-testid={`row-profile-merge-history-${entry.id}`}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-medium truncate" data-testid={`text-profile-merge-removed-${entry.id}`}>
                                {entry.removedSnapshotName ?? "Unknown"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">absorbed</span>
                              {alreadySplit && (
                                <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/25 no-default-active-elevate shrink-0">
                                  <Scissors className="w-2.5 h-2.5 mr-1" />
                                  split
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {entry.removedSnapshotEmail && (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  {entry.removedSnapshotEmail}
                                </span>
                              )}
                              {entry.removedSnapshotPhone && (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  {entry.removedSnapshotPhone}
                                </span>
                              )}
                              {recordCount > 0 && (
                                <span className="text-[11px] text-muted-foreground">
                                  {recordCount} record{recordCount !== 1 ? "s" : ""} re-linked
                                </span>
                              )}
                              {entry.triggeredBy ? (() => {
                                const staff = staffList.find(s => s.id === entry.triggeredBy);
                                const name = staff?.displayName ?? staff?.username ?? entry.triggeredBy;
                                return (
                                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <UserCircle className="w-3 h-3 shrink-0" />
                                    {name}
                                  </span>
                                );
                              })() : (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 italic">
                                  <UserCircle className="w-3 h-3 shrink-0" />
                                  system / automated
                                </span>
                              )}
                              {entry.mergedAt && (
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDate(entry.mergedAt)}
                                </span>
                              )}
                            </div>
                            {!alreadySplit && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-1"
                                onClick={() => {
                                  setSplittingId(entry.id);
                                  splitMutation.mutate(entry.id);
                                }}
                                disabled={isSplitting || splitMutation.isPending}
                                data-testid={`button-profile-split-merge-${entry.id}`}
                              >
                                <Scissors className={`w-3 h-3 mr-1 ${isSplitting ? "animate-pulse" : ""}`} />
                                {isSplitting ? "Reversing..." : "Reverse merge"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                          {Array.isArray(l.reassignment_history) && l.reassignment_history.length > 0 && (
                            <div className="mt-0.5 space-y-0.5" data-testid={`text-reassignment-history-lead-${l.id}`}>
                              {l.reassignment_history.map((entry: {customerName: string; timestamp: string; staffName?: string}, i: number) => (
                                <p key={i} className="text-[10px] text-amber-500 dark:text-amber-400">
                                  Previously: {entry.customerName}
                                  <span className="text-muted-foreground ml-1">
                                    ({new Date(entry.timestamp).toLocaleDateString()}{entry.staffName ? ` · ${entry.staffName}` : ""})
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}
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
                          {Array.isArray(q.reassignment_history) && q.reassignment_history.length > 0 && (
                            <div className="mt-0.5 space-y-0.5" data-testid={`text-reassignment-history-quote-${q.id}`}>
                              {q.reassignment_history.map((entry: {customerName: string; timestamp: string; staffName?: string}, i: number) => (
                                <p key={i} className="text-[10px] text-amber-500 dark:text-amber-400">
                                  Previously: {entry.customerName}
                                  <span className="text-muted-foreground ml-1">
                                    ({new Date(entry.timestamp).toLocaleDateString()}{entry.staffName ? ` · ${entry.staffName}` : ""})
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}
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
                          {Array.isArray(c.reassignment_history) && c.reassignment_history.length > 0 && (
                            <div className="mt-0.5 space-y-0.5" data-testid={`text-reassignment-history-convo-${c.id}`}>
                              {c.reassignment_history.map((entry: {customerName: string; timestamp: string; staffName?: string}, i: number) => (
                                <p key={i} className="text-[10px] text-amber-500 dark:text-amber-400">
                                  Previously: {entry.customerName}
                                  <span className="text-muted-foreground ml-1">
                                    ({new Date(entry.timestamp).toLocaleDateString()}{entry.staffName ? ` · ${entry.staffName}` : ""})
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}
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

      {/* Merge confirmation dialog */}
      <Dialog open={showMergeConfirm} onOpenChange={setShowMergeConfirm}>
        <DialogContent data-testid="dialog-merge-confirm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Confirm customer merge
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              This will permanently combine two customer records into one. The removed customer will be deleted, but the merge can be reversed from the Merge History panel.
            </DialogDescription>
          </DialogHeader>

          {selectedMergeTarget && mergeKeepId && (
            <div className="space-y-3 py-1">
              <div className="rounded-md bg-muted/50 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-[hsl(86_53%_60%)] shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[hsl(86_53%_60%)]">Keep (surviving record)</p>
                    <p className="text-sm font-semibold">
                      {mergeKeepId === id ? data?.customer.name : selectedMergeTarget.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mergeKeepId === id
                        ? [data?.customer.email, data?.customer.phone].filter(Boolean).join(" · ") || "No contact details"
                        : [selectedMergeTarget.email, selectedMergeTarget.phone].filter(Boolean).join(" · ") || "No contact details"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-destructive shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Remove (will be deleted)</p>
                    <p className="text-sm font-semibold">
                      {mergeKeepId === id ? selectedMergeTarget.name : data?.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mergeKeepId === id
                        ? [selectedMergeTarget.email, selectedMergeTarget.phone].filter(Boolean).join(" · ") || "No contact details"
                        : [data?.customer.email, data?.customer.phone].filter(Boolean).join(" · ") || "No contact details"
                      }
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                All leads, quotes, and conversations from the removed record will be reassigned to the surviving record. Contact details will be merged automatically.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMergeConfirm(false)}
              disabled={mergeMutation.isPending}
              data-testid="button-merge-cancel"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleMergeConfirm}
              disabled={mergeMutation.isPending}
              data-testid="button-merge-execute"
            >
              {mergeMutation.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
              ) : (
                <Merge className="w-3.5 h-3.5 mr-1.5" />
              )}
              {mergeMutation.isPending ? "Merging..." : "Confirm merge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
