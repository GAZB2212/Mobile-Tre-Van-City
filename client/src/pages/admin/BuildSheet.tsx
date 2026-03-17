import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer } from "lucide-react";
import type { Quote, Van, Kit, Upgrade, FinancePlan } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

function PrintCheckbox({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-0 cursor-pointer select-none"
      style={{ minWidth: 0 }}
    >
      {/* Screen: real checkbox hidden, custom square shown */}
      <span className="print:hidden inline-flex items-center justify-center w-5 h-5 rounded border-2 border-foreground/50 flex-shrink-0 mr-3"
        style={{ background: checked ? 'currentColor' : 'transparent' }}
        onClick={() => onChange(!checked)}
        aria-hidden="true"
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-background" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      {/* Print: always show an empty square the engineer can tick */}
      <span className="hidden print:inline-block w-5 h-5 border-2 border-black mr-3 flex-shrink-0 align-middle" aria-hidden="true" />
    </label>
  );
}

export default function BuildSheet() {
  const params = useParams();
  const quoteId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };

  // Checked items stored in localStorage per quote
  const storageKey = `buildsheet-checked-${quoteId}`;
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const setChecked = useCallback((itemKey: string, value: boolean) => {
    setCheckedItems(prev => {
      const next = { ...prev, [itemKey]: value };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const isChecked = (key: string) => !!checkedItems[key];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (user && (!user.adminRole || user.adminRole === "none")) {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/"; }, 1000);
    }
  }, [user, toast]);

  const { data: quotes = [], isLoading: isLoadingQuotes } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: vans = [] } = useQuery<Van[]>({
    queryKey: ["/api/admin/vans"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: kits = [] } = useQuery<Kit[]>({
    queryKey: ["/api/admin/kits"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: allUpgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: financePlans = [] } = useQuery<FinancePlan[]>({
    queryKey: ["/api/admin/finance-plans"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const quote = quotes.find((q) => q.id === quoteId);
  const van = quote?.vanId ? vans.find((v) => v.id === quote.vanId) : undefined;
  const kit = kits.find((k) => k.id === quote?.kitId);
  const upgrades = allUpgrades.filter((u) => quote?.selectedUpgradeIds.includes(u.id));
  const financePlan = quote?.financePlanId ? financePlans.find((f) => f.id === quote.financePlanId) : undefined;

  // ── Build-sheet supersession logic ──────────────────────────────────────────
  // Variants inherit their parent's supersedesKitItems if the variant itself has none.
  // This allows the admin to configure supersession on the parent and have it apply
  // when any variant of that upgrade is selected by a customer.
  const upgradesWithSupersession = upgrades.map((u) => {
    const uAny = u as any;
    const ownItems: string[] = Array.isArray(uAny.supersedesKitItems) ? uAny.supersedesKitItems : [];
    if (ownItems.length === 0 && uAny.parentId) {
      const parent = allUpgrades.find((p) => p.id === uAny.parentId);
      const parentItems: string[] = parent && Array.isArray((parent as any).supersedesKitItems)
        ? (parent as any).supersedesKitItems : [];
      if (parentItems.length > 0) {
        // Use parent name for display so build sheet shows the upgrade family name
        return { ...u, supersedesKitItems: parentItems, _displayName: parent!.name } as any;
      }
    }
    return { ...u, _displayName: u.name } as any;
  });

  const supersedingUpgrades = upgradesWithSupersession.filter(
    (u) => Array.isArray(u.supersedesKitItems) && u.supersedesKitItems.length > 0
  );
  const regularUpgrades = upgradesWithSupersession.filter(
    (u) => !Array.isArray(u.supersedesKitItems) || u.supersedesKitItems.length === 0
  );

  // Build a lookup: lower-cased kit item text → the upgrade that supersedes it
  const kitItemToUpgrade = new Map<string, typeof upgradesWithSupersession[0]>();
  for (const upgrade of supersedingUpgrades) {
    for (const item of (upgrade.supersedesKitItems as string[])) {
      kitItemToUpgrade.set(item.trim().toLowerCase(), upgrade);
    }
  }

  // Compute the effective kit items list for rendering:
  // Each entry is either a plain kit string or a superseding upgrade.
  type KitEntry =
    | { kind: "kit"; text: string; origIdx: number }
    | { kind: "upgrade"; upgrade: typeof upgradesWithSupersession[0]; origIdx: number };

  const effectiveKitItems: KitEntry[] = [];
  const renderedUpgradeIds = new Set<string>();

  if (kit) {
    kit.includes.forEach((item, idx) => {
      const matchingUpgrade = kitItemToUpgrade.get(item.trim().toLowerCase());
      if (matchingUpgrade) {
        if (!renderedUpgradeIds.has(matchingUpgrade.id)) {
          // First match: show the upgrade in place of this kit item
          effectiveKitItems.push({ kind: "upgrade", upgrade: matchingUpgrade, origIdx: idx });
          renderedUpgradeIds.add(matchingUpgrade.id);
        }
        // Subsequent matches for the same upgrade: skip (item is removed)
      } else {
        effectiveKitItems.push({ kind: "kit", text: item, origIdx: idx });
      }
    });
  }

  const formatDate = (dateString: string | Date | null): string => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatBuildStage = (stage: string | null): string => {
    if (!stage) return "Not Started";
    return stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePrint = () => { window.print(); };

  if (isLoading || isLoadingQuotes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.adminRole || user.adminRole === "none") return null;

  if (!isLoadingQuotes && !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Quote not found</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/admin/quotes")} data-testid="button-back-to-quotes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <>
      {/* Print-override styles injected into head via a style tag */}
      <style>{`
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
          }
          * {
            color: #000000 !important;
            background: #ffffff !important;
            border-color: #000000 !important;
            box-shadow: none !important;
          }
          .print-checkbox-square {
            display: inline-block !important;
            width: 14px !important;
            height: 14px !important;
            border: 2px solid #000 !important;
            margin-right: 10px !important;
            flex-shrink: 0 !important;
            vertical-align: middle !important;
          }
        }
      `}</style>

      {/* Nav bar — hidden on print */}
      <div className="no-print bg-background border-b p-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setLocation("/admin/quotes")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>
          <Button onClick={handlePrint} data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            Print Build Sheet
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl print:max-w-full print:px-0 print:py-4">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-1" data-testid="text-page-title">Van Build Sheet</h1>
          <p className="text-xl font-semibold mb-2 print:text-black" data-testid="text-build-sheet-company">
            {quote.company || quote.userName}
          </p>
          <p className="text-muted-foreground print:text-black">
            Quote Reference: <strong>{quote.id.substring(0, 8).toUpperCase()}</strong>
          </p>
          <p className="text-sm text-muted-foreground print:text-black">Date: {formatDate(quote.createdAt)}</p>
        </div>

        <div className="space-y-6">

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground print:text-black">Name</p>
                  <p className="font-medium" data-testid="text-customer-name">{quote.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground print:text-black">Email</p>
                  <p className="font-medium" data-testid="text-customer-email">{quote.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground print:text-black">Phone</p>
                  <p className="font-medium" data-testid="text-customer-phone">{quote.phone}</p>
                </div>
                {quote.company && (
                  <div>
                    <p className="text-sm text-muted-foreground print:text-black">Company</p>
                    <p className="font-medium" data-testid="text-customer-company">{quote.company}</p>
                  </div>
                )}
              </div>
              {quote.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground print:text-black">Customer Request Notes</p>
                  <p className="text-sm" data-testid="text-customer-notes">{quote.notes}</p>
                </div>
              )}
              {quote.adminNotes && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted-foreground print:text-black">Admin Notes (Internal)</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-admin-notes">{quote.adminNotes}</p>
                </div>
              )}
              {quote.customerNotes && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted-foreground print:text-black">Customer Notes</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-customer-facing-notes">{quote.customerNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Van Spec */}
          {van && (
            <Card>
              <CardHeader>
                <CardTitle>Base Vehicle Specification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold" data-testid="text-van-title">
                    {van.make} {van.model} ({van.year})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground print:text-black">Mileage</p>
                      <p className="font-medium" data-testid="text-van-mileage">{van.mileage.toLocaleString()} miles</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground print:text-black">Transmission</p>
                      <p className="font-medium" data-testid="text-van-transmission">{van.specs.transmission}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground print:text-black">Fuel Type</p>
                      <p className="font-medium" data-testid="text-van-fuel">{van.specs.fuel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground print:text-black">Size/Body Type</p>
                      <p className="font-medium" data-testid="text-van-size">{van.specs.size}</p>
                    </div>
                    {van.specs.engine && (
                      <div>
                        <p className="text-muted-foreground print:text-black">Engine</p>
                        <p className="font-medium" data-testid="text-van-engine">{van.specs.engine}</p>
                      </div>
                    )}
                    {van.specs.doors && (
                      <div>
                        <p className="text-muted-foreground print:text-black">Doors</p>
                        <p className="font-medium" data-testid="text-van-doors">{van.specs.doors}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kit Items — with checkboxes */}
          {kit && (
            <Card>
              <CardHeader>
                <CardTitle>Equipment Package — Items to Install</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-base" data-testid="text-kit-name">{kit.name}</p>
                    <p className="text-sm text-muted-foreground print:text-black mt-0.5" data-testid="text-kit-description">{kit.description}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {effectiveKitItems.map((entry, idx) => {
                      const itemKey = entry.kind === "upgrade"
                        ? `kit-upgrade-${entry.upgrade.id}`
                        : `kit-${entry.origIdx}`;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1 py-1.5 border-b last:border-0"
                          data-testid={`row-kit-item-${idx}`}
                        >
                          <PrintCheckbox
                            id={`checkbox-${itemKey}`}
                            checked={isChecked(itemKey)}
                            onChange={v => setChecked(itemKey, v)}
                          />
                          {entry.kind === "upgrade" ? (
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline gap-x-2">
                                <span
                                  className={`text-sm font-semibold ${isChecked(itemKey) ? 'line-through text-muted-foreground print:no-underline print:text-black' : ''}`}
                                  data-testid={`text-kit-includes-${idx}`}
                                >
                                  {(entry.upgrade as any)._displayName ?? entry.upgrade.name}
                                </span>
                                {/* Show variant name when it differs from the parent display name */}
                                {(entry.upgrade as any)._displayName && (entry.upgrade as any)._displayName !== entry.upgrade.name && (
                                  <span className="text-xs font-medium text-muted-foreground print:text-black">
                                    {entry.upgrade.name}
                                  </span>
                                )}
                                <span className="text-xs font-bold uppercase tracking-wide text-accent print:text-black">
                                  (Upgraded)
                                </span>
                              </div>
                              {entry.upgrade.description && (
                                <p className="text-xs text-muted-foreground print:text-black mt-0.5">
                                  {entry.upgrade.description}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span
                              className={`text-sm font-medium flex-1 ${isChecked(itemKey) ? 'line-through text-muted-foreground print:no-underline print:text-black' : ''}`}
                              data-testid={`text-kit-includes-${idx}`}
                            >
                              {entry.text}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upgrades — with checkboxes (superseding upgrades are shown in the kit section above) */}
          {regularUpgrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Equipment &amp; Upgrades — Items to Install</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {regularUpgrades.map((upgrade) => {
                    const quantity = quote.selectedUpgrades?.[upgrade.id] || 1;
                    const itemKey = `upgrade-${upgrade.id}`;
                    return (
                      <div
                        key={upgrade.id}
                        className="flex items-start gap-1 py-2 border-b last:border-0"
                        data-testid={`row-upgrade-${upgrade.id}`}
                      >
                        <PrintCheckbox
                          id={`checkbox-upgrade-${upgrade.id}`}
                          checked={isChecked(itemKey)}
                          onChange={v => setChecked(itemKey, v)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            {quantity > 1 && (
                              <span className="font-bold text-accent print:text-black text-base flex-shrink-0">
                                {quantity}&times;
                              </span>
                            )}
                            {/* If this is a variant, show parent name as context */}
                            {(upgrade as any).parentId && (() => {
                              const parent = allUpgrades.find(p => p.id === (upgrade as any).parentId);
                              return parent ? (
                                <span className="text-sm font-semibold text-foreground print:text-black">
                                  {parent.name}
                                </span>
                              ) : null;
                            })()}
                            <p
                              className={`font-semibold text-sm ${(upgrade as any).parentId ? 'text-muted-foreground print:text-black' : ''} ${isChecked(itemKey) ? 'line-through text-muted-foreground print:no-underline print:text-black' : ''}`}
                              data-testid={`text-upgrade-name-${upgrade.id}`}
                            >
                              {upgrade.name}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground print:text-black mt-0.5" data-testid={`text-upgrade-description-${upgrade.id}`}>
                            {upgrade.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Build Status */}
          <Card>
            <CardHeader>
              <CardTitle>Build Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground print:text-black">Current Build Stage</p>
                  <p className="text-lg font-semibold" data-testid="text-build-stage">{formatBuildStage(quote.buildStage)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground print:text-black">Quote Status</p>
                  <p className="font-medium" data-testid="text-quote-status">
                    {quote.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                {quote.graphicsArtworkUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground print:text-black">Graphics Artwork</p>
                    <p className="font-medium" data-testid="text-artwork-status">
                      Artwork uploaded — See attached file
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workshop instructions */}
        <div className="mt-8 p-4 border rounded-md print:border-black">
          <p className="text-sm font-bold mb-2">Build Team Instructions</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Verify all equipment and parts are available before starting build</li>
            <li>Check vehicle condition and note any pre-existing damage</li>
            <li>Tick each item above as it is fitted or installation is in progress</li>
            <li>Follow installation guides for all equipment packages</li>
            <li>Test all installed equipment before sign-off</li>
            <li>Update the build stage in the system as work progresses</li>
          </ul>

          {/* Print-only signature line */}
          <div className="hidden print:block mt-6 pt-4 border-t border-black">
            <div className="grid grid-cols-2 gap-8 mt-2">
              <div>
                <p className="text-xs font-semibold mb-6">Engineer Name:</p>
                <div className="border-b border-black h-px" />
              </div>
              <div>
                <p className="text-xs font-semibold mb-6">Signed &amp; Completed:</p>
                <div className="border-b border-black h-px" />
              </div>
              <div>
                <p className="text-xs font-semibold mb-6">Date Started:</p>
                <div className="border-b border-black h-px" />
              </div>
              <div>
                <p className="text-xs font-semibold mb-6">Date Completed:</p>
                <div className="border-b border-black h-px" />
              </div>
            </div>
          </div>
        </div>

        {/* Print-only footer */}
        <div className="hidden print:block mt-6 text-center text-xs text-black border-t border-black pt-3">
          <p>Mobile Tyre Van City &mdash; Internal Workshop Document &mdash; {formatDate(new Date())}</p>
          <p>Quote Ref: {quote.id.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>
    </>
  );
}
