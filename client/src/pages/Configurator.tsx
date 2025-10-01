import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConfiguratorStepper from "@/components/ConfiguratorStepper";
import EquipmentGrid from "@/components/EquipmentGrid";
import PriceSummary from "@/components/PriceSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Kit, Upgrade } from "@shared/schema";

// Helper to transform upgrades with variations
interface UpgradeGroup {
  parent: Upgrade;
  variants: Upgrade[];
}

function groupUpgradeVariations(upgrades: Upgrade[]): { groups: UpgradeGroup[]; standalone: Upgrade[] } {
  const groups: UpgradeGroup[] = [];
  const standalone: Upgrade[] = [];
  
  // Track parent IDs and child IDs
  const parentIds = new Set<string>();
  const childIds = new Set<string>();
  
  // First pass: identify all parent and child relationships
  upgrades.forEach(upgrade => {
    if (upgrade.parentId) {
      childIds.add(upgrade.id);
      parentIds.add(upgrade.parentId);
    }
  });
  
  // Build parent-child groups
  const parentMap = new Map<string, UpgradeGroup>();
  upgrades.forEach(upgrade => {
    if (upgrade.parentId) {
      // This is a child variation
      let group = parentMap.get(upgrade.parentId);
      if (!group) {
        const parent = upgrades.find(u => u.id === upgrade.parentId);
        if (parent) {
          group = { parent, variants: [] };
          parentMap.set(upgrade.parentId, group);
        }
      }
      if (group) {
        group.variants.push(upgrade);
      }
    }
  });
  
  // Collect standalone items (not parents, not children)
  upgrades.forEach(upgrade => {
    if (!upgrade.parentId && !parentIds.has(upgrade.id)) {
      standalone.push(upgrade);
    }
  });
  
  return {
    groups: Array.from(parentMap.values()),
    standalone
  };
}

interface ConfiguratorData {
  kits: Kit[];
  upgrades: Record<string, Upgrade[]>;
}

interface PricingData {
  subtotal: number;
  vat: number;
  total: number;
  vatRate: number;
}

export default function Configurator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVan, setSelectedVan] = useState<string | null>(null);
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);
  const [showVAT, setShowVAT] = useState(true);

  // Load saved configuration from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('configuratorState');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.selectedVan) setSelectedVan(parsed.selectedVan);
        if (parsed.selectedKit) setSelectedKit(parsed.selectedKit);
        if (parsed.selectedUpgrades && Array.isArray(parsed.selectedUpgrades)) {
          setSelectedUpgrades(parsed.selectedUpgrades);
        }
        if (typeof parsed.showVAT === 'boolean') setShowVAT(parsed.showVAT);
        if (typeof parsed.currentStep === 'number' && parsed.currentStep >= 1 && parsed.currentStep <= 4) {
          setCurrentStep(parsed.currentStep);
        }
      }
    } catch (error) {
      console.warn('Failed to load configurator state from localStorage:', error);
    }
  }, []);

  // Save configuration to localStorage whenever state changes
  useEffect(() => {
    const configState = {
      currentStep,
      selectedVan,
      selectedKit,
      selectedUpgrades,
      showVAT
    };
    try {
      localStorage.setItem('configuratorState', JSON.stringify(configState));
    } catch (error) {
      console.warn('Failed to save configurator state to localStorage:', error);
    }
  }, [currentStep, selectedVan, selectedKit, selectedUpgrades, showVAT]);

  // Fetch configurator data
  const { data: configuratorData, isLoading } = useQuery<ConfiguratorData>({
    queryKey: ['/api/configurator/data'],
  });

  // Calculate pricing
  const calculatePricing = useMutation<PricingData, Error, { vanId?: string; kitId?: string; upgradeIds: string[] }>({
    mutationFn: async ({ vanId, kitId, upgradeIds }) => {
      const response = await fetch('/api/configurator/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vanId, kitId, upgradeIds }),
      });
      if (!response.ok) throw new Error('Failed to calculate pricing');
      return response.json();
    },
  });

  // Calculate pricing when selections change
  useEffect(() => {
    if (selectedKit) {
      calculatePricing.mutate({
        vanId: selectedVan || undefined,
        kitId: selectedKit,
        upgradeIds: selectedUpgrades,
      });
    }
  }, [selectedVan, selectedKit, selectedUpgrades]);

  const handleUpgradeToggle = (upgradeId: string) => {
    setSelectedUpgrades(prev => 
      prev.includes(upgradeId) 
        ? prev.filter(id => id !== upgradeId)
        : [...prev, upgradeId]
    );
  };

  const handleRequestQuote = () => {
    console.log('Quote requested for configurator');
    // todo: implement actual quote request with form submission
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-configurator-title">
            Configure Your Mobile Tyre Van
          </h1>
          <p className="text-lg text-muted-foreground">
            Build your perfect mobile tyre business setup with our step-by-step configurator
          </p>
        </div>

        <ConfiguratorStepper 
          currentStep={currentStep} 
          onStepChange={setCurrentStep}
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Your Base Van</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Select from our stock vehicles or indicate you'll provide your own van.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> You can proceed directly to equipment selection. Van pricing will be calculated separately based on your specific requirements.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => setCurrentStep(2)}
                        className="bg-chart-3 hover:bg-chart-3/90 text-black"
                        data-testid="button-next-step-1"
                      >
                        Continue to Equipment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && configuratorData && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Choose Your Equipment Kit</h2>
                    <p className="text-muted-foreground">
                      Select the tyre changing equipment that best fits your business needs
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {configuratorData.kits.map((kit) => (
                      <Card 
                        key={kit.id} 
                        className={`cursor-pointer transition-all hover-elevate ${
                          selectedKit === kit.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedKit(kit.id)}
                        data-testid={`card-kit-${kit.id}`}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg leading-tight">{kit.name}</CardTitle>
                            <Badge variant="secondary">
                              £{(kit.price / 100).toLocaleString()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">
                            {kit.description}
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Includes:</p>
                            {kit.includes.map((item, index) => (
                              <p key={index} className="text-xs text-muted-foreground">• {item}</p>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <Badge variant="outline" className="text-xs">
                              {kit.powerKw}kW Power
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="flex gap-4 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(1)}
                      data-testid="button-back-step-2"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(3)}
                      disabled={!selectedKit}
                      className="bg-chart-3 hover:bg-chart-3/90 text-black"
                      data-testid="button-next-step-2"
                    >
                      Continue to Upgrades
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 3 && configuratorData && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Add Upgrades & Extras</h2>
                    <p className="text-muted-foreground">
                      Enhance your van with additional features and equipment upgrades
                    </p>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(configuratorData.upgrades).map(([category, upgrades]) => {
                      const { groups, standalone } = groupUpgradeVariations(upgrades);
                      
                      return (
                        <Card key={category}>
                          <CardHeader>
                            <CardTitle className="text-lg capitalize">
                              {category.replace('-', ' ')} Options
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-3">
                              {/* Render standalone upgrades with checkbox */}
                              {standalone.map((upgrade) => (
                                <div 
                                  key={upgrade.id}
                                  className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate"
                                >
                                  <Checkbox
                                    id={upgrade.id}
                                    checked={selectedUpgrades.includes(upgrade.id)}
                                    onCheckedChange={() => handleUpgradeToggle(upgrade.id)}
                                    data-testid={`checkbox-upgrade-${upgrade.id}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <label 
                                        htmlFor={upgrade.id}
                                        className="font-medium cursor-pointer leading-tight"
                                      >
                                        {upgrade.name}
                                      </label>
                                      <Badge variant="secondary" className="ml-2 flex-shrink-0">
                                        £{(upgrade.price / 100).toLocaleString()}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {upgrade.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Render equipment with variations using dropdown */}
                              {groups.map(({ parent, variants }) => {
                                const selectedVariantId = selectedUpgrades.find(id => 
                                  variants.some(v => v.id === id)
                                );
                                const selectedVariant = variants.find(v => v.id === selectedVariantId);
                                
                                return (
                                  <div 
                                    key={parent.id}
                                    className="p-3 rounded-lg border space-y-3"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h4 className="font-medium leading-tight">{parent.name}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {parent.description}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-3 items-center">
                                      <Select
                                        value={selectedVariantId || ""}
                                        onValueChange={(value) => {
                                          // Remove all variants from selection
                                          const filtered = selectedUpgrades.filter(id => 
                                            !variants.some(v => v.id === id)
                                          );
                                          // Add the selected variant
                                          if (value) {
                                            setSelectedUpgrades([...filtered, value]);
                                          } else {
                                            setSelectedUpgrades(filtered);
                                          }
                                        }}
                                      >
                                        <SelectTrigger 
                                          className="flex-1"
                                          data-testid={`select-variant-${parent.id}`}
                                        >
                                          <SelectValue placeholder="Select option..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="">None</SelectItem>
                                          {variants.map((variant) => (
                                            <SelectItem key={variant.id} value={variant.id}>
                                              {variant.variantName || variant.name} - £{(variant.price / 100).toLocaleString()}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {selectedVariant && (
                                        <Badge variant="secondary" className="flex-shrink-0">
                                          £{(selectedVariant.price / 100).toLocaleString()}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(2)}
                      data-testid="button-back-step-3"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(4)}
                      className="bg-chart-3 hover:bg-chart-3/90 text-black"
                      data-testid="button-next-step-3"
                    >
                      Review Summary
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 4 && configuratorData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedKit && (
                        <div>
                          <h3 className="font-medium mb-2">Selected Equipment Kit:</h3>
                          {(() => {
                            const kit = configuratorData.kits.find(k => k.id === selectedKit);
                            return kit ? (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{kit.name}</p>
                                    <p className="text-sm text-muted-foreground">{kit.description}</p>
                                  </div>
                                  <Badge variant="secondary">
                                    £{(kit.price / 100).toLocaleString()}
                                  </Badge>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}

                      {selectedUpgrades.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Selected Upgrades:</h3>
                          <div className="space-y-2">
                            {selectedUpgrades.map(upgradeId => {
                              const upgrade = Object.values(configuratorData.upgrades)
                                .flat()
                                .find(u => u.id === upgradeId);
                              return upgrade ? (
                                <div key={upgrade.id} className="bg-muted/50 rounded-lg p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{upgrade.name}</p>
                                      <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                                    </div>
                                    <Badge variant="secondary">
                                      £{(upgrade.price / 100).toLocaleString()}
                                    </Badge>
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentStep(3)}
                        data-testid="button-back-step-4"
                      >
                        Back to Upgrades
                      </Button>
                      <Button 
                        onClick={handleRequestQuote}
                        className="bg-chart-2 hover:bg-chart-2/90"
                        data-testid="button-final-quote"
                      >
                        Request Final Quote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

            <div className="lg:col-span-1">
              <PriceSummary 
                subtotal={calculatePricing.data?.subtotal || 0}
                vat={calculatePricing.data?.vat || 0}
                total={calculatePricing.data?.total || 0}
                showVAT={showVAT}
                onVATToggle={setShowVAT}
                onRequestQuote={handleRequestQuote}
                isCalculating={calculatePricing.isPending}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}