import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  Zap,
  Package,
  Layers,
  CreditCard,
  Car,
  Star,
} from "lucide-react";
import type { Kit, Upgrade, FinancePlan } from "@shared/schema";
import type { AIConfig, AITrackers } from "@/lib/aiConfiguratorMapping";

const AI_CHAT_KEY = "ai-chat:v1";

const CATEGORY_LABELS: Record<string, string> = {
  "air-systems": "Air Systems",
  "air-system": "Air Systems",
  "equipment": "Equipment",
  "equipment-options": "Equipment Options",
  "branding": "Branding",
  "security": "Security",
  "lighting": "Lighting",
  "business": "Business",
  "technology": "Technology",
  "comfort": "Comfort",
  "storage": "Storage",
  "safety": "Safety",
  "power": "Power",
  "accessories": "Accessories",
  "commercial": "Commercial / Hybrid",
};

interface AIChatState {
  sessionId: string;
  messages: Array<{ role: string; content: string }>;
  config: AIConfig;
  stage: string;
  trackers: AITrackers;
  savedAt: string;
}

function useAIChatState(): AIChatState | null {
  const [state, setState] = useState<AIChatState | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AI_CHAT_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);
  return state;
}

// Collapsible section wrapper
function Section({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between gap-2 pb-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <CardTitle className="text-base">{title}</CardTitle>
          {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
        </div>
        <Button variant="ghost" size="icon" tabIndex={-1} className="shrink-0" data-testid={`button-toggle-section-${title}`}>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

export default function AIReview() {
  const [, navigate] = useLocation();
  const { state, setKit, addUpgrade, removeUpgrade, setFinancePlan } = useConfigurator();
  const aiState = useAIChatState();
  const aiConfig = aiState?.config ?? null;

  const { data: kits = [] } = useQuery<Kit[]>({ queryKey: ["/api/kits"] });
  const { data: allUpgrades = [] } = useQuery<Upgrade[]>({ queryKey: ["/api/upgrades"] });
  const { data: financePlans = [] } = useQuery<FinancePlan[]>({ queryKey: ["/api/finance-plans"] });

  const selectedKit = kits.find(k => k.id === state.kitId);
  const selectedUpgrades = allUpgrades.filter(u => state.upgradeIds.includes(u.id));

  // Group upgrades by category
  const upgradesByCategory = allUpgrades.reduce<Record<string, Upgrade[]>>((acc, u) => {
    const cat = u.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(u);
    return acc;
  }, {});

  const packageLabel: Record<string, string> = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
  };

  const financeLabel: Record<string, string> = {
    outright: "Buy outright",
    lease: "Business lease",
    finance: "Spread the cost (finance)",
  };

  const vanLabel = aiConfig?.ownVan === false
    ? `${aiConfig.vanSize ?? "Panel van"} — supplied by us`
    : aiConfig?.ownVan === true
    ? "Customer's own van"
    : state.customVanDescription ?? "Not specified";

  const handleToggleUpgrade = (upgradeId: string) => {
    if (state.upgradeIds.includes(upgradeId)) {
      removeUpgrade(upgradeId);
    } else {
      addUpgrade(upgradeId);
    }
  };

  const handleProceed = () => {
    navigate("/configurator/quote");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page heading — intentionally no stepper */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 bg-[#8bc440]/15 rounded-full p-2 shrink-0">
              <Zap className="w-5 h-5 text-[#8bc440]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Your AI-built configuration</h1>
              <p className="text-muted-foreground mt-1">
                We've put this spec together based on your answers. Review everything below and make any
                adjustments before getting your quote — this is your starting point, not the final word.
              </p>
              {aiConfig?.packageId && (
                <Badge className="mt-2 bg-[#8bc440]/20 text-[#8bc440] border-[#8bc440]/30" variant="outline">
                  <Layers className="w-3 h-3 mr-1" />
                  {packageLabel[aiConfig.packageId]} package
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Van */}
          <Section title="Van" icon={<Car className="w-4 h-4" />}>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm">{vanLabel}</span>
              {aiConfig?.includes48v && (
                <Badge variant="outline" className="text-xs text-[#8bc440] border-[#8bc440]/30 bg-[#8bc440]/10">
                  <Zap className="w-3 h-3 mr-1" /> 48V system included
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              To change the van, use the full configurator from the beginning.
            </p>
          </Section>

          {/* Kit */}
          <Section title="Tyre Equipment Kit" icon={<Package className="w-4 h-4" />} badge={selectedKit?.name}>
            <div className="space-y-2">
              {kits.map(kit => (
                <button
                  key={kit.id}
                  onClick={() => setKit(kit.id)}
                  data-testid={`button-select-kit-${kit.id}`}
                  className={`w-full flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                    state.kitId === kit.id
                      ? "border-[#8bc440] bg-[#8bc440]/10"
                      : "border-border hover-elevate"
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    state.kitId === kit.id ? "border-[#8bc440]" : "border-muted-foreground/40"
                  }`}>
                    {state.kitId === kit.id && <div className="w-2 h-2 rounded-full bg-[#8bc440]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{kit.name}</span>
                      {kit.id === state.kitId && (
                        <Badge variant="outline" className="text-[10px] text-[#8bc440] border-[#8bc440]/30 py-0">
                          Selected by AI
                        </Badge>
                      )}
                    </div>
                    {kit.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{kit.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* Upgrades */}
          <Section
            title="Extras & Upgrades"
            icon={<Star className="w-4 h-4" />}
            badge={`${selectedUpgrades.length} selected`}
          >
            {selectedUpgrades.length > 0 && (
              <div className="mb-4 p-3 bg-muted/40 rounded-md">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Currently in your build
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUpgrades.map(u => (
                    <button
                      key={u.id}
                      onClick={() => removeUpgrade(u.id)}
                      data-testid={`button-remove-upgrade-${u.id}`}
                      className="flex items-center gap-1.5 text-xs bg-[#8bc440]/15 text-[#8bc440] border border-[#8bc440]/30 rounded-md px-2 py-1 hover:bg-red-500/15 hover:text-red-400 hover:border-red-400/30 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      {u.name}
                      <span className="opacity-60 ml-0.5">✕</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Click any item to remove it</p>
              </div>
            )}

            <div className="space-y-5">
              {Object.entries(upgradesByCategory).sort().map(([category, catUpgrades]) => {
                const hasSelected = catUpgrades.some(u => state.upgradeIds.includes(u.id));
                return (
                  <div key={category}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      {CATEGORY_LABELS[category] ?? category}
                      {hasSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#8bc440] inline-block" />}
                    </p>
                    <div className="space-y-2">
                      {catUpgrades.map(u => {
                        const selected = state.upgradeIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            className={`flex items-start gap-3 rounded-md border p-2.5 cursor-pointer transition-colors ${
                              selected ? "border-[#8bc440]/50 bg-[#8bc440]/5" : "border-border hover-elevate"
                            }`}
                            onClick={() => handleToggleUpgrade(u.id)}
                            data-testid={`checkbox-upgrade-${u.id}`}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => handleToggleUpgrade(u.id)}
                              className="mt-0.5 data-[state=checked]:bg-[#8bc440] data-[state=checked]:border-[#8bc440]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-medium">{u.name}</span>
                                {u.popular && (
                                  <Badge variant="outline" className="text-[10px] py-0">Popular</Badge>
                                )}
                              </div>
                              {u.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{u.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Finance */}
          <Section title="Payment Method" icon={<CreditCard className="w-4 h-4" />}>
            <div className="space-y-2">
              {[
                { value: "outright", label: "Buy outright", description: "Full payment upfront, no interest." },
                { value: "lease", label: "Business lease", description: "Monthly payments, off the balance sheet." },
                { value: "finance", label: "Spread the cost", description: "Finance over agreed term at competitive rates." },
              ].map(option => {
                const matchedPlan = financePlans.find(p => {
                  if (option.value === "lease") return p.type === "lease";
                  if (option.value === "finance") return p.type === "hire_purchase" || p.type === "finance";
                  return false;
                });
                const isSelected =
                  (option.value === "outright" && !state.financePlanId) ||
                  (option.value !== "outright" && state.financePlanId === matchedPlan?.id) ||
                  (option.value !== "outright" && aiConfig?.financePreference === option.value && !state.financePlanId);

                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (option.value === "outright") {
                        setFinancePlan(null);
                      } else if (matchedPlan) {
                        setFinancePlan(matchedPlan.id);
                      }
                    }}
                    data-testid={`button-finance-${option.value}`}
                    className={`w-full flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                      isSelected ? "border-[#8bc440] bg-[#8bc440]/10" : "border-border hover-elevate"
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-[#8bc440]" : "border-muted-foreground/40"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#8bc440]" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Proceed CTA */}
          <div className="pt-2 pb-10">
            <Button
              onClick={handleProceed}
              data-testid="button-get-quote"
              className="w-full bg-[#8bc440e6] text-[#191919] hover:bg-[#8bc440] font-semibold text-base h-12"
            >
              Get my quote
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Your configuration is saved. You can also{" "}
              <button
                className="underline hover:text-foreground"
                onClick={() => navigate("/configurator/van")}
                data-testid="button-use-full-configurator"
              >
                use the full configurator
              </button>{" "}
              if you prefer.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
