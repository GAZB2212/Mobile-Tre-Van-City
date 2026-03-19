import { useAuth } from "@/hooks/useAuth";
import type { User, Van, Kit, Upgrade } from "@shared/schema";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Car,
  Package,
  Wrench,
  Calculator,
  CheckCircle2,
  Circle,
  ChevronRight,
  Loader2,
  PoundSterling,
  Phone,
} from "lucide-react";

const FINANCE_APR = 0.109;

function fmt(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(pence / 100);
}

function calcMonthlyPayment(principalPence: number, termMonths: number): number {
  if (principalPence <= 0 || termMonths <= 0) return 0;
  const monthlyRate = FINANCE_APR / 12;
  const pv = Math.pow(1 + monthlyRate, termMonths);
  return Math.round((principalPence * monthlyRate * pv) / (pv - 1));
}

type ServiceType = "car" | "commercial" | "hybrid";

interface SaveQuoteForm {
  userName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

export default function AdminConfigurator() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };

  // Configurator selections
  const [selectedVanId, setSelectedVanId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("car");
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [selectedUpgrades, setSelectedUpgrades] = useState<Record<string, number>>({});

  // Finance inputs
  const [depositInput, setDepositInput] = useState<string>("");
  const [termMonths, setTermMonths] = useState<number>(60);

  // Save as quote dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveForm, setSaveForm] = useState<SaveQuoteForm>({
    userName: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (user && (!user.adminRole || user.adminRole === "none")) {
      navigate("/");
    }
  }, [user, navigate]);

  // Data fetching
  const { data: vans = [], isLoading: vansLoading } = useQuery<Van[]>({
    queryKey: ["/api/vans"],
  });

  const { data: kits = [], isLoading: kitsLoading } = useQuery<Kit[]>({
    queryKey: ["/api/kits"],
  });

  const { data: upgrades = [], isLoading: upgradesLoading } = useQuery<Upgrade[]>({
    queryKey: ["/api/upgrades"],
  });

  // Derived data
  const selectedVan = vans.find((v) => v.id === selectedVanId) ?? null;

  const isEuroSix = selectedVan?.euroStatus?.toLowerCase().includes("euro 6") ?? false;

  const filteredKits = useMemo(() => {
    return kits
      .filter((k) => {
        const types = k.serviceType as string[];
        if (!types.includes(serviceType)) return false;
        if (isEuroSix && !k.euroSixCompatible) return false;
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [kits, serviceType, isEuroSix]);

  // Clear kit if no longer compatible after van/service type change
  useEffect(() => {
    if (selectedKitId && !filteredKits.find((k) => k.id === selectedKitId)) {
      setSelectedKitId(null);
    }
  }, [filteredKits, selectedKitId]);

  const selectedKit = kits.find((k) => k.id === selectedKitId) ?? null;

  // Parent upgrades (not variants)
  const parentUpgrades = useMemo(
    () => upgrades.filter((u) => !u.parentId),
    [upgrades]
  );

  // Group upgrade variants by parent
  const variantsByParent = useMemo(() => {
    const map: Record<string, Upgrade[]> = {};
    upgrades
      .filter((u) => u.parentId)
      .forEach((u) => {
        if (!map[u.parentId!]) map[u.parentId!] = [];
        map[u.parentId!].push(u);
      });
    return map;
  }, [upgrades]);

  // Organize upgrades by category
  const upgradesByCategory = useMemo(() => {
    const map: Record<string, Upgrade[]> = {};
    parentUpgrades.forEach((u) => {
      const cat = u.category || "other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(u);
    });
    return map;
  }, [parentUpgrades]);

  // Pricing calculation (all in pence)
  const vanPrice = selectedVan?.price ?? 0;
  const kitPrice = selectedKit?.price ?? 0;
  const upgradesTotal = useMemo(() => {
    return Object.entries(selectedUpgrades).reduce((sum, [id, qty]) => {
      const upgrade = upgrades.find((u) => u.id === id);
      return sum + (upgrade?.price ?? 0) * qty;
    }, 0);
  }, [selectedUpgrades, upgrades]);

  const subtotal = vanPrice + kitPrice + upgradesTotal;
  const vat = Math.round(subtotal * 0.2);
  const total = subtotal + vat;

  // Finance calculation
  const depositPence = Math.round((parseFloat(depositInput) || 0) * 100);
  const principal = Math.max(0, total - depositPence);
  const monthlyPayment = calcMonthlyPayment(principal, termMonths);
  const weeklyPayment = Math.round((monthlyPayment * 12) / 52);

  // Toggle upgrade selection (handles variants)
  function toggleUpgrade(upgrade: Upgrade) {
    const variants = variantsByParent[upgrade.id] ?? [];

    if (variants.length > 0) {
      // Parent with variants — selecting parent deselects all its variants and selects parent
      setSelectedUpgrades((prev) => {
        const next = { ...prev };
        if (next[upgrade.id]) {
          delete next[upgrade.id];
        } else {
          variants.forEach((v) => delete next[v.id]);
          next[upgrade.id] = 1;
        }
        return next;
      });
    } else {
      setSelectedUpgrades((prev) => {
        const next = { ...prev };
        if (next[upgrade.id]) {
          delete next[upgrade.id];
        } else {
          // If this is a variant, deselect sibling variants and parent
          if (upgrade.parentId) {
            const siblings = variantsByParent[upgrade.parentId] ?? [];
            siblings.forEach((s) => delete next[s.id]);
            delete next[upgrade.parentId];
          }
          next[upgrade.id] = 1;
        }
        return next;
      });
    }
  }

  function isUpgradeSelected(id: string) {
    return !!selectedUpgrades[id];
  }

  // Save as quote mutation
  const saveQuoteMutation = useMutation({
    mutationFn: async (form: SaveQuoteForm) => {
      const body = {
        userName: form.userName,
        email: form.email,
        phone: form.phone,
        company: form.company || undefined,
        notes: form.notes || undefined,
        serviceType,
        vanId: selectedVanId || undefined,
        kitId: selectedKitId || undefined,
        selectedUpgradeIds: Object.keys(selectedUpgrades),
        selectedUpgrades,
        trainingOptionIds: [],
        financeInputs: depositPence > 0 || termMonths > 0
          ? { deposit: depositPence, term: termMonths }
          : undefined,
        estSubtotal: subtotal,
        estVAT: vat,
        estTotal: total,
        estDiscount: 0,
        status: "new",
      };
      const res = await apiRequest("POST", "/api/quotes", body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save quote");
      }
      return res.json();
    },
    onSuccess: (quote) => {
      toast({ title: "Quote saved", description: `Quote created for ${saveForm.userName}` });
      setSaveDialogOpen(false);
      setSaveForm({ userName: "", email: "", phone: "", company: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      navigate(`/admin/quotes/${quote.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.adminRole || user.adminRole === "none") return null;

  const dataLoading = vansLoading || kitsLoading || upgradesLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Admin
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent" />
                <span className="font-semibold">Phone Configurator</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedVanId(null);
                  setSelectedKitId(null);
                  setSelectedUpgrades({});
                  setDepositInput("");
                  setTermMonths(60);
                }}
                data-testid="button-reset-configurator"
              >
                Reset
              </Button>
              <Button
                size="sm"
                className="bg-[#8bc440e6] text-[#191919] hover:bg-[#8bc440]"
                disabled={total === 0}
                onClick={() => setSaveDialogOpen(true)}
                data-testid="button-save-as-quote"
              >
                Save as Quote
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* Left Column — Configurator */}
            <div className="space-y-6">
              {/* Van Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Car className="w-4 h-4 text-accent" />
                    Select Van
                    {selectedVan && (
                      <Badge variant="secondary" className="ml-auto font-normal">
                        {selectedVan.title}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vans.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No vans available.</p>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                      {vans.map((van) => {
                        const selected = van.id === selectedVanId;
                        return (
                          <button
                            key={van.id}
                            data-testid={`button-van-${van.id}`}
                            onClick={() => {
                              setSelectedVanId(selected ? null : van.id);
                              setSelectedKitId(null);
                            }}
                            className={`
                              flex-shrink-0 w-44 rounded-md border text-left p-3 transition-colors
                              ${selected
                                ? "border-accent bg-accent/10"
                                : "border-border hover-elevate"
                              }
                            `}
                          >
                            {van.heroImage ? (
                              <img
                                src={van.heroImage}
                                alt={van.title}
                                className="w-full h-20 object-cover rounded-sm mb-2"
                              />
                            ) : (
                              <div className="w-full h-20 bg-muted rounded-sm mb-2 flex items-center justify-center">
                                <Car className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <p className="font-medium text-sm leading-snug line-clamp-2">{van.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{van.euroStatus || "—"}</p>
                            <p className="text-sm font-semibold text-accent mt-1">
                              {fmt(van.price)}
                            </p>
                            {selected && (
                              <CheckCircle2 className="w-4 h-4 text-accent mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Type */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Service Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {(["car", "commercial", "hybrid"] as ServiceType[]).map((type) => (
                      <Button
                        key={type}
                        variant={serviceType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setServiceType(type);
                          setSelectedKitId(null);
                        }}
                        data-testid={`button-service-${type}`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Equipment Pack */}
              {serviceType !== "commercial" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="w-4 h-4 text-accent" />
                      Equipment Pack
                      {selectedKit && (
                        <Badge variant="secondary" className="ml-auto font-normal">
                          {selectedKit.name}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredKits.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No compatible packs for this van and service type.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredKits.map((kit) => {
                          const selected = kit.id === selectedKitId;
                          return (
                            <button
                              key={kit.id}
                              data-testid={`button-kit-${kit.id}`}
                              onClick={() =>
                                setSelectedKitId(selected ? null : kit.id)
                              }
                              className={`
                                rounded-md border text-left p-3 transition-colors
                                ${selected
                                  ? "border-accent bg-accent/10"
                                  : "border-border hover-elevate"
                                }
                              `}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm">{kit.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {kit.description}
                                  </p>
                                </div>
                                {selected ? (
                                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                              <p className="text-sm font-semibold text-accent mt-2">
                                {fmt(kit.price)}
                              </p>
                              {kit.powerKw && (
                                <p className="text-xs text-muted-foreground">{kit.powerKw} kW</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Upgrades */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="w-4 h-4 text-accent" />
                    Upgrades
                    {Object.keys(selectedUpgrades).length > 0 && (
                      <Badge variant="secondary" className="ml-auto font-normal">
                        {Object.keys(selectedUpgrades).length} selected
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {parentUpgrades.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No upgrades available.</p>
                  ) : (
                    <div className="space-y-5">
                      {Object.entries(upgradesByCategory).map(([category, items]) => (
                        <div key={category}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {category.replace(/-/g, " ")}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {items.map((upgrade) => {
                              const variants = variantsByParent[upgrade.id] ?? [];
                              const hasVariants = variants.length > 0;
                              const parentSelected = isUpgradeSelected(upgrade.id);
                              const anyVariantSelected = hasVariants &&
                                variants.some((v) => isUpgradeSelected(v.id));

                              return (
                                <div key={upgrade.id}>
                                  <button
                                    data-testid={`button-upgrade-${upgrade.id}`}
                                    onClick={() => toggleUpgrade(upgrade)}
                                    className={`
                                      w-full rounded-md border text-left px-3 py-2 transition-colors
                                      ${(parentSelected || anyVariantSelected)
                                        ? "border-accent bg-accent/10"
                                        : "border-border hover-elevate"
                                      }
                                    `}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm line-clamp-1">{upgrade.name}</p>
                                        <p className="text-sm text-accent font-semibold">{fmt(upgrade.price)}</p>
                                      </div>
                                      {(parentSelected && !hasVariants) ? (
                                        <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      )}
                                    </div>
                                  </button>

                                  {/* Variants */}
                                  {hasVariants && (
                                    <div className="ml-3 mt-1 space-y-1">
                                      {variants.map((variant) => {
                                        const vSelected = isUpgradeSelected(variant.id);
                                        return (
                                          <button
                                            key={variant.id}
                                            data-testid={`button-upgrade-variant-${variant.id}`}
                                            onClick={() => toggleUpgrade(variant)}
                                            className={`
                                              w-full rounded-md border text-left px-3 py-1.5 transition-colors
                                              ${vSelected
                                                ? "border-accent bg-accent/10"
                                                : "border-border hover-elevate"
                                              }
                                            `}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <div>
                                                <p className="text-sm">{variant.variantName || variant.name}</p>
                                                <p className="text-xs text-accent font-semibold">{fmt(variant.price)}</p>
                                              </div>
                                              {vSelected ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                                              ) : (
                                                <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                              )}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column — Price Summary + Finance */}
            <div className="space-y-4 lg:sticky lg:top-[57px]">
              {/* Price Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PoundSterling className="w-4 h-4 text-accent" />
                    Price Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {total === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Select a van or items to see pricing
                    </p>
                  ) : (
                    <>
                      {selectedVan && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate mr-2">{selectedVan.make} {selectedVan.model}</span>
                          <span>{fmt(vanPrice)}</span>
                        </div>
                      )}
                      {selectedKit && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate mr-2">{selectedKit.name}</span>
                          <span>{fmt(kitPrice)}</span>
                        </div>
                      )}
                      {Object.entries(selectedUpgrades).map(([id, qty]) => {
                        const upgrade = upgrades.find((u) => u.id === id);
                        if (!upgrade) return null;
                        return (
                          <div key={id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground truncate mr-2">
                              {upgrade.variantName ? `${upgrade.name} (${upgrade.variantName})` : upgrade.name}
                              {qty > 1 && ` ×${qty}`}
                            </span>
                            <span>{fmt(upgrade.price * qty)}</span>
                          </div>
                        );
                      })}
                      <div className="border-t pt-2 mt-2 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal (ex. VAT)</span>
                          <span>{fmt(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">VAT (20%)</span>
                          <span>{fmt(vat)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-base border-t pt-2">
                          <span>Total (inc. VAT)</span>
                          <span className="text-accent">{fmt(total)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Finance Calculator */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calculator className="w-4 h-4 text-accent" />
                    Finance Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="deposit" className="text-sm mb-1.5 block">
                      Deposit (£)
                    </Label>
                    <Input
                      id="deposit"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0.00"
                      value={depositInput}
                      onChange={(e) => setDepositInput(e.target.value)}
                      data-testid="input-deposit"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <Label className="text-sm">Term</Label>
                      <span className="text-sm font-medium">
                        {termMonths} months
                        {termMonths % 12 === 0 && termMonths > 0
                          ? ` (${termMonths / 12} yr)`
                          : ""}
                      </span>
                    </div>
                    <Slider
                      min={12}
                      max={120}
                      step={6}
                      value={[termMonths]}
                      onValueChange={([v]) => setTermMonths(v)}
                      data-testid="slider-term"
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>12 mo</span>
                      <span>120 mo</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Amount financed</span>
                      <span className="text-sm font-medium">{fmt(Math.max(0, principal))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">APR</span>
                      <span className="text-sm font-medium">
                        {(FINANCE_APR * 100).toFixed(1)}%
                      </span>
                    </div>
                    {monthlyPayment > 0 ? (
                      <>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="font-medium">Monthly</span>
                          <span className="text-xl font-bold text-accent">{fmt(monthlyPayment)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Weekly (approx.)</span>
                          <span className="text-sm font-semibold">{fmt(weeklyPayment)}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm text-center py-2">
                        {total === 0
                          ? "Add items to calculate finance"
                          : depositPence >= total
                          ? "Deposit covers full amount"
                          : "Adjust deposit and term"}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Representative figure at {(FINANCE_APR * 100).toFixed(1)}% APR. Subject to credit check.
                  </p>
                </CardContent>
              </Card>

              {/* Save CTA */}
              <Button
                className="w-full bg-[#8bc440e6] text-[#191919] hover:bg-[#8bc440]"
                disabled={total === 0}
                onClick={() => setSaveDialogOpen(true)}
                data-testid="button-save-quote-bottom"
              >
                Save as Quote
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Save as Quote Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sq-name" className="text-sm mb-1.5 block">
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sq-name"
                  value={saveForm.userName}
                  onChange={(e) =>
                    setSaveForm((f) => ({ ...f, userName: e.target.value }))
                  }
                  placeholder="John Smith"
                  data-testid="input-quote-name"
                />
              </div>
              <div>
                <Label htmlFor="sq-phone" className="text-sm mb-1.5 block">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sq-phone"
                  type="tel"
                  value={saveForm.phone}
                  onChange={(e) =>
                    setSaveForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="07700 900000"
                  data-testid="input-quote-phone"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sq-email" className="text-sm mb-1.5 block">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sq-email"
                type="email"
                value={saveForm.email}
                onChange={(e) =>
                  setSaveForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="john@example.com"
                data-testid="input-quote-email"
              />
            </div>
            <div>
              <Label htmlFor="sq-company" className="text-sm mb-1.5 block">
                Company (optional)
              </Label>
              <Input
                id="sq-company"
                value={saveForm.company}
                onChange={(e) =>
                  setSaveForm((f) => ({ ...f, company: e.target.value }))
                }
                placeholder="Acme Tyres Ltd"
                data-testid="input-quote-company"
              />
            </div>
            <div>
              <Label htmlFor="sq-notes" className="text-sm mb-1.5 block">
                Notes (optional)
              </Label>
              <Textarea
                id="sq-notes"
                value={saveForm.notes}
                onChange={(e) =>
                  setSaveForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Any additional notes from the call…"
                className="resize-none"
                rows={3}
                data-testid="input-quote-notes"
              />
            </div>
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total (inc. VAT)</span>
                <span className="font-semibold text-accent">{fmt(total)}</span>
              </div>
              {monthlyPayment > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Monthly ({termMonths}mo)</span>
                  <span className="font-semibold">{fmt(monthlyPayment)}/mo</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#8bc440e6] text-[#191919] hover:bg-[#8bc440]"
              disabled={
                !saveForm.userName.trim() ||
                !saveForm.email.trim() ||
                !saveForm.phone.trim() ||
                saveQuoteMutation.isPending
              }
              onClick={() => saveQuoteMutation.mutate(saveForm)}
              data-testid="button-confirm-save-quote"
            >
              {saveQuoteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Save Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
