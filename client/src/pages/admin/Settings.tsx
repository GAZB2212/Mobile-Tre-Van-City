import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plug,
  PlugZap,
  Phone,
  Plus,
  Pencil,
  Trash2,
  PhoneCall,
  ChevronUp,
  ChevronDown,
  KeyRound,
} from "lucide-react";
import type { User, StaffPhone } from "@shared/schema";

export default function AdminSettings() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isFullAdmin = user?.adminRole === "full";

  // ── Sage ──────────────────────────────────────────────────────────────────
  const { data: sageStatus, isLoading: sageLoading } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/sage/status"],
    enabled: isFullAdmin,
  });
  const sageConnected = sageStatus?.connected ?? false;

  const disconnectSageMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/sage/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sage/status"] });
      toast({ title: "Sage disconnected", description: "Sage Business Cloud has been unlinked." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to disconnect Sage." });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sageParam = params.get("sage");
    if (sageParam === "connected") {
      queryClient.invalidateQueries({ queryKey: ["/api/sage/status"] });
      toast({ title: "Sage connected", description: "Sage Business Cloud is now linked to your account." });
      setLocation("/admin/settings", { replace: true });
    } else if (sageParam === "error") {
      toast({ variant: "destructive", title: "Sage connection failed", description: "Something went wrong during authorisation. Please try again." });
      setLocation("/admin/settings", { replace: true });
    }
  }, []);

  // ── Twilio status ──────────────────────────────────────────────────────────
  const { data: twilioStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/admin/twilio/status"],
    enabled: isFullAdmin,
  });
  const twilioConfigured = twilioStatus?.configured ?? false;

  // ── Staff phone numbers ────────────────────────────────────────────────────
  const { data: staffPhones = [], isLoading: phonesLoading } = useQuery<StaffPhone[]>({
    queryKey: ["/api/admin/staff-phones"],
  });

  const [phoneDialog, setPhoneDialog] = useState<{ open: boolean; editing: StaffPhone | null }>({ open: false, editing: null });
  const [phoneLabel, setPhoneLabel] = useState("Mobile");
  const [phoneNumber, setPhoneNumber] = useState("");

  function openAddPhone() {
    setPhoneLabel("Mobile");
    setPhoneNumber("");
    setPhoneDialog({ open: true, editing: null });
  }

  function openEditPhone(p: StaffPhone) {
    setPhoneLabel(p.label);
    setPhoneNumber(p.phone);
    setPhoneDialog({ open: true, editing: p });
  }

  const savePhoneMutation = useMutation({
    mutationFn: async () => {
      if (phoneDialog.editing) {
        const res = await apiRequest("PATCH", `/api/admin/staff-phones/${phoneDialog.editing.id}`, {
          label: phoneLabel.trim(),
          phone: phoneNumber.trim(),
        });
        if (!res.ok) throw new Error("Failed to update");
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/staff-phones", {
          label: phoneLabel.trim(),
          phone: phoneNumber.trim(),
        });
        if (!res.ok) throw new Error("Failed to create");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff-phones"] });
      setPhoneDialog({ open: false, editing: null });
      toast({ title: phoneDialog.editing ? "Phone number updated" : "Phone number added" });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to save phone number" }),
  });

  const deletePhoneMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/staff-phones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff-phones"] });
      toast({ title: "Phone number removed" });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to remove phone number" }),
  });

  const reorderPhoneMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/staff-phones/${id}`, { sortOrder: newOrder });
      if (!res.ok) throw new Error("Failed to reorder");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/staff-phones"] }),
    onError: () => toast({ variant: "destructive", title: "Failed to reorder" }),
  });

  const movePhone = (index: number, direction: "up" | "down") => {
    const phones = [...staffPhones];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= phones.length) return;
    const a = phones[index];
    const b = phones[targetIndex];
    reorderPhoneMutation.mutate({ id: a.id, newOrder: b.sortOrder });
    reorderPhoneMutation.mutate({ id: b.id, newOrder: a.sortOrder });
  };

  const isAdmin = user?.adminRole === "full" || user?.adminRole === "basic";
  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage integrations and account configuration.</p>
      </div>

      <Separator />

      {/* Full-admin-only integrations */}
      {isFullAdmin && (
        <>
          {/* Staff phone numbers — managed by full admins; used by all admins for click-to-call */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">Staff Phone Numbers</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={openAddPhone} data-testid="button-add-phone">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add number
                </Button>
              </div>
              <CardDescription className="mt-1">
                Phone numbers available for staff to use with the click-to-call bridge. When staff click "Call via bridge", Twilio rings the chosen number, then connects them to the customer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {phonesLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : staffPhones.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <PhoneCall className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No phone numbers added yet.</p>
                  <Button size="sm" variant="outline" onClick={openAddPhone} data-testid="button-add-phone-empty">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add the first number
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {staffPhones.map((p, idx) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2" data-testid={`staff-phone-${p.id}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{p.phone}</span>
                        <span className="text-xs text-muted-foreground truncate">{p.label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => movePhone(idx, "up")}
                          disabled={idx === 0 || reorderPhoneMutation.isPending}
                          data-testid={`button-move-phone-up-${p.id}`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => movePhone(idx, "down")}
                          disabled={idx === staffPhones.length - 1 || reorderPhoneMutation.isPending}
                          data-testid={`button-move-phone-down-${p.id}`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditPhone(p)}
                          data-testid={`button-edit-phone-${p.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deletePhoneMutation.mutate(p.id)}
                          disabled={deletePhoneMutation.isPending}
                          data-testid={`button-delete-phone-${p.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Twilio click-to-call */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">Twilio Click-to-Call</CardTitle>
                </div>
                {twilioStatus && (
                  twilioConfigured ? (
                    <Badge
                      className="bg-[#8bc440]/15 text-[#8bc440] border-[#8bc440]/30 no-default-active-elevate"
                      variant="outline"
                      data-testid="badge-twilio-status"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground no-default-active-elevate"
                      data-testid="badge-twilio-status"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Not configured
                    </Badge>
                  )
                )}
              </div>
              <CardDescription className="mt-1">
                When configured, staff can click "Call Now" on any quote or lead — Twilio rings the staff phone first, then bridges the call to the customer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {twilioConfigured ? (
                <p className="text-sm text-muted-foreground">
                  Twilio is active. Staff can use the call bridge from the Quotes and Leads pages. Each call attempt is logged as a note automatically.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Add the following three secrets to your environment to enable click-to-call:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li><code className="text-foreground">TWILIO_ACCOUNT_SID</code> — from your Twilio console</li>
                    <li><code className="text-foreground">TWILIO_AUTH_TOKEN</code> — from your Twilio console</li>
                    <li><code className="text-foreground">TWILIO_FROM_NUMBER</code> — your Twilio phone number (e.g. <code>+441234567890</code>)</li>
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open("https://console.twilio.com", "_blank")}
                    data-testid="button-open-twilio"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Open Twilio Console
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Sage Business Cloud Accounting */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">Sage Business Cloud Accounting</CardTitle>
                </div>
                {!sageLoading && (
                  sageConnected ? (
                    <Badge
                      className="bg-[#8bc440]/15 text-[#8bc440] border-[#8bc440]/30 no-default-active-elevate"
                      variant="outline"
                      data-testid="badge-sage-status"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground no-default-active-elevate"
                      data-testid="badge-sage-status"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Not connected
                    </Badge>
                  )
                )}
              </div>
              <CardDescription className="mt-1">
                Push completed quotes directly to Sage as sales invoices with one click from any quote detail page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sageConnected ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Your Sage account is linked. You can now push any quote to Sage from the quote detail page using the
                    "Push to Sage" button.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open("https://accounting.sage.com", "_blank")}
                      data-testid="button-open-sage"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open Sage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => disconnectSageMutation.mutate()}
                      disabled={disconnectSageMutation.isPending}
                      data-testid="button-disconnect-sage"
                    >
                      <PlugZap className="w-3.5 h-3.5 mr-1.5" />
                      {disconnectSageMutation.isPending ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Connect your Sage Business Cloud Accounting account to enable one-click invoice creation from quotes.
                    You will be redirected to Sage to authorise the connection.
                  </p>
                  <Button
                    size="sm"
                    className="bg-[#1c5f3a] text-white"
                    onClick={() => { window.location.href = "/api/sage/auth"; }}
                    data-testid="button-connect-sage"
                  >
                    <Plug className="w-3.5 h-3.5 mr-1.5" />
                    Connect Sage
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Kiosk undo PINs — managed by full admins */}
      {isFullAdmin && (
        <>
          <Separator />
          <KioskPinsCard />
        </>
      )}

      {/* Add/Edit phone number dialog */}
      <Dialog open={phoneDialog.open} onOpenChange={(open) => { if (!open) setPhoneDialog({ open: false, editing: null }); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{phoneDialog.editing ? "Edit phone number" : "Add phone number"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone-label">Label</Label>
              <Input
                id="phone-label"
                value={phoneLabel}
                onChange={(e) => setPhoneLabel(e.target.value)}
                placeholder="Mobile, Office, etc."
                data-testid="input-phone-label"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone-number">Phone number</Label>
              <Input
                id="phone-number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+447700000000"
                data-testid="input-phone-number"
              />
              <p className="text-xs text-muted-foreground">Include the country code, e.g. +44 for UK.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPhoneDialog({ open: false, editing: null })}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => savePhoneMutation.mutate()}
              disabled={!phoneNumber.trim() || savePhoneMutation.isPending}
              data-testid="button-save-phone"
            >
              {savePhoneMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Kiosk PIN management ─────────────────────────────────────────────────────
// Full-admin-only. Each lad has a 4-digit PIN they enter on the kiosk to undo
// a stage tick. PINs persist in site_settings so a redeploy doesn't wipe them.
// Empty input clears the override — if a KIOSK_PIN_<INITIALS> env var was set
// (legacy / fallback), it will start being used again.

type KioskPinRow = { initials: string; name: string; hasPin: boolean; source: "db" | "env" | null };

function KioskPinsCard() {
  const { toast } = useToast();
  const { data: rows = [], isLoading } = useQuery<KioskPinRow[]>({
    queryKey: ["/api/admin/kiosk-pins"],
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: async ({ initials, pin }: { initials: string; pin: string }) => {
      const res = await apiRequest("PUT", `/api/admin/kiosk-pins/${initials}`, { pin });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to save PIN");
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kiosk-pins"] });
      setDrafts((d) => ({ ...d, [vars.initials]: "" }));
      toast({
        title: vars.pin ? "PIN updated" : "PIN cleared",
        description: vars.pin
          ? `${vars.initials} can now undo stages with their new PIN.`
          : `${vars.initials}'s override removed.`,
      });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Could not save", description: err?.message ?? "Unknown error" });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base">Kiosk Undo PINs</CardTitle>
        </div>
        <CardDescription className="mt-1">
          Each lad has a 4-digit PIN they enter on the workshop kiosk to undo a stage tick. Set or rotate
          them here — changes apply instantly. Leave blank and save to clear an override.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const draft = drafts[r.initials] ?? "";
              return (
                <li
                  key={r.initials}
                  className="flex items-center gap-3 rounded-md border px-3 py-2"
                  data-testid={`kiosk-pin-row-${r.initials}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-bold text-sm w-8 tabular-nums">{r.initials}</span>
                    <span className="text-sm truncate">{r.name}</span>
                    {r.hasPin ? (
                      <Badge variant="outline" className="ml-1 text-xs no-default-active-elevate">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {r.source === "env" ? "Set (env)" : "Set"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-1 text-xs text-muted-foreground no-default-active-elevate">
                        Not set
                      </Badge>
                    )}
                  </div>
                  <Input
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    placeholder={r.hasPin ? "Replace…" : "4 digits"}
                    value={draft}
                    onChange={(e) => setDrafts((d) => ({ ...d, [r.initials]: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    className="w-24 font-mono tabular-nums text-center"
                    data-testid={`input-pin-${r.initials}`}
                  />
                  <Button
                    size="sm"
                    disabled={saveMutation.isPending || (draft.length > 0 && draft.length !== 4)}
                    onClick={() => saveMutation.mutate({ initials: r.initials, pin: draft })}
                    data-testid={`button-save-pin-${r.initials}`}
                  >
                    {draft.length === 4 ? "Save" : "Clear"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Tip: triple-tap a ticked stage on the kiosk to open the undo dialog. Only the lad who ticked it
          can undo it, and only with their PIN.
        </p>
      </CardContent>
    </Card>
  );
}
