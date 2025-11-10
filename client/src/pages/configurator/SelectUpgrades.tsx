import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ConfiguratorSummary } from "@/components/ConfiguratorSummary";
import { ConfiguratorTutorial } from "@/components/ConfiguratorTutorial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ImageGallery, ImageThumbnail } from "@/components/ImageGallery";
import { UpgradeDetailsModal } from "@/components/UpgradeDetailsModal";
import { ArrowRight, ArrowLeft, Star, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Upgrade, Van } from "@shared/schema";

interface ConfiguratorData {
  kits: any[];
  upgrades: Record<string, Upgrade[]>;
  financePlans: any[];
}

interface UpgradeGroup {
  parent: Upgrade;
  variants: Upgrade[];
}

// Define preferred category order
const CATEGORY_ORDER = [
  'air-systems',
  'air-system',
  'equipment',
  'equipment-options',
  'branding',
  'lighting',
  'comfort',
  'power',
  'technology',
  'security'
];

function getCategoryOrder(category: string): number {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? 999 : index; // Unknown categories go to the end
}

function groupUpgradeVariations(upgrades: Upgrade[]): { groups: UpgradeGroup[]; standalone: Upgrade[] } {
  const groups: UpgradeGroup[] = [];
  const standalone: Upgrade[] = [];
  
  const parentIds = new Set<string>();
  const childIds = new Set<string>();
  
  upgrades.forEach(upgrade => {
    if (upgrade.parentId) {
      childIds.add(upgrade.id);
      parentIds.add(upgrade.parentId);
    }
  });
  
  const parentMap = new Map<string, UpgradeGroup>();
  upgrades.forEach(upgrade => {
    if (upgrade.parentId) {
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

export default function SelectUpgrades() {
  const [, setLocation] = useLocation();
  const { state, addUpgrade, removeUpgrade } = useConfigurator();
  const [upgradeQuantities, setUpgradeQuantities] = useState<Record<string, number>>({});
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<Upgrade | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Upgrade[]>([]);

  const { data: configuratorData, isLoading } = useQuery<ConfiguratorData>({
    queryKey: ['/api/configurator/data'],
  });

  // Fetch selected van if vanId exists
  const { data: selectedVan } = useQuery<Van>({
    queryKey: ['/api/vans', state.vanId],
    enabled: !!state.vanId,
  });

  // Define mutually exclusive upgrade names (branding options)
  const brandingOptions = ['Graphic Pack', 'Full Wrap', 'Half Wrap'];
  
  const isBrandingOption = (upgradeName: string) => {
    return brandingOptions.some(option => upgradeName.toLowerCase().includes(option.toLowerCase()));
  };

  // Define mutually exclusive air system upgrade IDs
  // PTO and Electric Start Compressor cannot be fitted at the same time
  const airSystemExclusiveIds = ['mounted-pto-air-system', 'compressor-12hp-270l'];
  
  const isAirSystemExclusive = (upgradeId: string) => {
    return airSystemExclusiveIds.includes(upgradeId);
  };

  // Detect van size from selected van, or from selected wrap size as fallback
  const getVanSize = (): 'LWB' | 'MWB' | 'SWB' | null => {
    // First priority: Use selected van's size if available
    if (selectedVan?.specs?.size) {
      const size = selectedVan.specs.size.toUpperCase();
      if (size === 'LWB' || size === 'MWB' || size === 'SWB') {
        return size as 'LWB' | 'MWB' | 'SWB';
      }
    }

    // Fallback: Detect from selected wrap if no van selected
    if (!configuratorData) return null;
    
    const allUpgrades = Object.values(configuratorData.upgrades).flat();
    const selectedUpgrades = allUpgrades.filter(u => state.upgradeIds.includes(u.id));
    
    // Check if any selected upgrade is a wrap/half wrap/graphic pack variant
    for (const upgrade of selectedUpgrades) {
      const parentId = upgrade.parentId;
      // Check if this is a variant of Full Wrap, Half Wrap, or Graphic Pack
      if (parentId === 'full-revalco-wrap' || parentId === 'half-wrap' || parentId === 'graphic-pack') {
        const variantName = upgrade.variantName?.toUpperCase() || '';
        if (variantName.includes('LWB')) return 'LWB';
        if (variantName.includes('MWB')) return 'MWB';
        if (variantName.includes('SWB')) return 'SWB';
      }
    }
    
    return null;
  };

  const vanSize = getVanSize();

  // Auto-remove incompatible interior walls when van size changes
  useEffect(() => {
    if (!vanSize || !configuratorData) return;
    
    const allUpgrades = Object.values(configuratorData.upgrades).flat();
    const selectedUpgrades = allUpgrades.filter(u => state.upgradeIds.includes(u.id));
    
    // Check if any selected interior wall is incompatible with the van size
    selectedUpgrades.forEach(upgrade => {
      const isInteriorWall = upgrade.name.toLowerCase().includes('interior');
      if (isInteriorWall && upgrade.variantName) {
        const variantName = upgrade.variantName.toUpperCase();
        const isIncompatible = 
          (vanSize === 'LWB' && variantName.includes('MWB')) ||
          (vanSize === 'MWB' && variantName.includes('LWB')) ||
          (vanSize === 'SWB' && (variantName.includes('LWB') || variantName.includes('MWB')));
        
        if (isIncompatible) {
          removeUpgrade(upgrade.id);
        }
      }
    });
  }, [vanSize, configuratorData, state.upgradeIds, removeUpgrade]);

  // Auto-remove mutually exclusive air system upgrades whenever state changes
  // This handles cases where users have both selected from old localStorage or quotes
  useEffect(() => {
    if (!configuratorData) return;
    
    // Check if user has both mutually exclusive air system upgrades selected
    const hasAllExclusiveItems = airSystemExclusiveIds.every(id => 
      state.upgradeIds.includes(id)
    );
    
    if (hasAllExclusiveItems) {
      // Remove all but the first one (keep the PTO as default preference)
      const toRemove = airSystemExclusiveIds.slice(1);
      toRemove.forEach(id => {
        if (state.upgradeIds.includes(id)) {
          removeUpgrade(id);
        }
      });
    }
  }, [configuratorData, state.upgradeIds, removeUpgrade]);

  const handleUpgradeToggle = (upgradeId: string) => {
    const upgrade = configuratorData?.upgrades 
      ? Object.values(configuratorData.upgrades).flat().find(u => u.id === upgradeId)
      : null;
    
    if (state.upgradeIds.includes(upgradeId)) {
      removeUpgrade(upgradeId);
    } else {
      const allUpgrades = configuratorData?.upgrades 
        ? Object.values(configuratorData.upgrades).flat()
        : [];
      
      // If this is a branding option, remove any other branding options first
      if (upgrade && isBrandingOption(upgrade.name)) {
        // Find and remove any other selected branding options
        state.upgradeIds.forEach(selectedId => {
          const selectedUpgrade = allUpgrades.find(u => u.id === selectedId);
          if (selectedUpgrade && isBrandingOption(selectedUpgrade.name) && selectedId !== upgradeId) {
            removeUpgrade(selectedId);
          }
        });
      }
      
      // If this is a mutually exclusive air system upgrade, remove the other one
      if (isAirSystemExclusive(upgradeId)) {
        // Find and remove the other mutually exclusive air system upgrade
        state.upgradeIds.forEach(selectedId => {
          if (isAirSystemExclusive(selectedId) && selectedId !== upgradeId) {
            removeUpgrade(selectedId);
          }
        });
      }
      
      addUpgrade(upgradeId);
    }
  };

  const handleQuantityChange = (upgradeId: string, quantity: number) => {
    setUpgradeQuantities((prev: Record<string, number>) => ({
      ...prev,
      [upgradeId]: quantity
    }));
  };

  const handleVariantSelect = (parentId: string, variantId: string | null) => {
    const allUpgrades = configuratorData?.upgrades 
      ? Object.values(configuratorData.upgrades).flat()
      : [];
    
    // Remove any previously selected variant from this parent
    const allVariants = allUpgrades.filter(u => u.parentId === parentId);
    
    allVariants.forEach(v => {
      if (state.upgradeIds.includes(v.id)) {
        removeUpgrade(v.id);
      }
    });

    // Add the new variant
    if (variantId) {
      const selectedVariant = allUpgrades.find(u => u.id === variantId);
      const parent = allUpgrades.find(u => u.id === parentId);
      
      // If this is a branding option, remove any other branding options first
      if (parent && isBrandingOption(parent.name)) {
        state.upgradeIds.forEach(selectedId => {
          const selectedUpgrade = allUpgrades.find(u => u.id === selectedId);
          if (selectedUpgrade && isBrandingOption(selectedUpgrade.name)) {
            removeUpgrade(selectedId);
          }
        });
      }
      
      // If this is a mutually exclusive air system upgrade, remove the other one
      if (isAirSystemExclusive(variantId)) {
        state.upgradeIds.forEach(selectedId => {
          if (isAirSystemExclusive(selectedId) && selectedId !== variantId) {
            removeUpgrade(selectedId);
          }
        });
      }
      
      addUpgrade(variantId);
    }
  };

  const formatPrice = (price: number, upgradeName?: string) => {
    // Show "POA" for Garage Branding and Apple CarPlay
    const lowerName = upgradeName?.toLowerCase() || '';
    if (lowerName.includes('garage branding') || lowerName.includes('carplay')) {
      return 'POA';
    }
    
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const handleContinue = () => {
    setLocation('/configurator/training');
  };

  const openGallery = (images: string[], title: string) => {
    setGalleryImages(images);
    setGalleryTitle(title);
    setGalleryOpen(true);
  };

  const openDetails = (upgrade: Upgrade, variants: Upgrade[] = []) => {
    setSelectedUpgrade(upgrade);
    setSelectedVariants(variants);
    setDetailsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/configurator/kit')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Kit Selection
            </Button>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-2 mt-4" data-testid="text-page-title">
              Step 3: Add Upgrades & Extras
            </h1>
            <p className="text-muted-foreground">
              Enhance your van with additional features and equipment upgrades
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            <div className="xl:col-span-2">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : configuratorData ? (
                <div className="space-y-6" data-testid="section-upgrades">
                  {Object.entries(configuratorData.upgrades)
                    .sort(([categoryA], [categoryB]) => getCategoryOrder(categoryA) - getCategoryOrder(categoryB))
                    .map(([category, upgrades]) => {
                    // Sort upgrades by sortOrder before grouping
                    const sortedUpgrades = [...upgrades].sort((a, b) => a.sortOrder - b.sortOrder);
                    const { groups, standalone } = groupUpgradeVariations(sortedUpgrades);
                    
                    // Filter interior wall variants based on van size (from van specs or selected wrap)
                    const filteredGroups = category === 'comfort' && vanSize
                      ? groups.map(group => {
                          // Check if this is an interior wall group
                          const isInteriorWalls = group.parent.name.toLowerCase().includes('interior');
                          if (isInteriorWalls) {
                            // Filter variants to only show matching size
                            const filteredVariants = group.variants.filter(variant => {
                              const variantName = variant.variantName?.toUpperCase() || '';
                              return variantName.includes(vanSize);
                            });
                            return { ...group, variants: filteredVariants };
                          }
                          return group;
                        }).filter(group => {
                          // Remove groups with no variants
                          return group.variants.length > 0;
                        })
                      : groups;
                    
                    // Sort groups by parent sortOrder
                    filteredGroups.sort((a, b) => a.parent.sortOrder - b.parent.sortOrder);
                    
                    // Combine and render in order: groups and standalone items mixed by sortOrder
                    const allItems = [
                      ...filteredGroups.map(g => ({ type: 'group' as const, sortOrder: g.parent.sortOrder, data: g })),
                      ...standalone.map(u => ({ type: 'standalone' as const, sortOrder: u.sortOrder, data: u }))
                    ].sort((a, b) => a.sortOrder - b.sortOrder);
                    
                    return (
                      <Card key={category}>
                        <CardHeader>
                          <CardTitle className="text-lg capitalize">
                            {category.replace('-', ' ')} Options
                          </CardTitle>
                          {category === 'comfort' && vanSize && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Showing {vanSize} options only {selectedVan ? '(based on your selected van)' : '(based on your selected wrap)'}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3">
                            {allItems.map((item) => {
                              if (item.type === 'standalone') {
                                const upgrade = item.data;
                                const isSelected = state.upgradeIds.includes(upgrade.id);
                                const quantity = upgradeQuantities[upgrade.id] || 1;
                                
                                return (
                                  <div 
                                    key={upgrade.id}
                                    className="p-3 rounded-lg border hover-elevate"
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Image thumbnail */}
                                      <ImageThumbnail
                                        images={upgrade.images || []}
                                        alt={upgrade.name}
                                        onOpenGallery={() => openGallery(upgrade.images || [], upgrade.name)}
                                        testId={`img-upgrade-${upgrade.id}`}
                                      />
                                      
                                      {/* Checkbox - centered with heading */}
                                      <Checkbox
                                        id={upgrade.id}
                                        checked={isSelected}
                                        onCheckedChange={() => handleUpgradeToggle(upgrade.id)}
                                        data-testid={`checkbox-upgrade-${upgrade.id}`}
                                      />
                                      
                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <label 
                                              htmlFor={upgrade.id}
                                              className="font-medium cursor-pointer leading-tight"
                                            >
                                              {upgrade.name}
                                            </label>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs w-fit"
                                              onClick={() => openDetails(upgrade)}
                                              data-testid={`button-info-${upgrade.id}`}
                                            >
                                              <Info className="w-3 h-3 mr-1" />
                                              More Info
                                            </Button>
                                          </div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {isSelected && upgrade.allowQuantity && (
                                              <div className="flex items-center gap-1">
                                                <label className="text-xs text-muted-foreground whitespace-nowrap">Qty:</label>
                                                <Input
                                                  type="number"
                                                  min="1"
                                                  max="10"
                                                  value={quantity}
                                                  onChange={(e) => handleQuantityChange(upgrade.id, parseInt(e.target.value) || 1)}
                                                  className="w-16 h-8 text-center"
                                                  data-testid={`input-quantity-${upgrade.id}`}
                                                />
                                              </div>
                                            )}
                                            <Badge variant="secondary" className="flex-shrink-0">
                                              {formatPrice(upgrade.price * (upgrade.allowQuantity && isSelected ? quantity : 1), upgrade.name)}
                                            </Badge>
                                          </div>
                                        </div>
                                        {upgrade.description && (
                                          <p className="text-sm text-muted-foreground mb-2">
                                            {upgrade.description}
                                          </p>
                                        )}
                                        {upgrade.popular && (
                                          <div className="flex justify-end">
                                            <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-sm font-medium">
                                              <Star className="w-3 h-3 fill-current" />
                                              Popular Upgrade
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else {
                                const { parent, variants } = item.data;
                                const selectedVariantId = state.upgradeIds.find(id => 
                                  variants.some(v => v.id === id)
                                );
                                const selectedVariant = variants.find(v => v.id === selectedVariantId);
                                const isSelected = !!selectedVariantId;
                                
                                // Calculate minimum price from variants
                                const minVariantPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : null;
                                
                                // Determine which images to show
                                // Show parent image initially, then selected variant image once chosen
                                const displayImages = (isSelected && selectedVariant?.images && selectedVariant.images.length > 0)
                                  ? selectedVariant.images 
                                  : parent.images;
                                
                                return (
                                  <div 
                                    key={parent.id}
                                    className="p-3 rounded-lg border hover-elevate"
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Image thumbnail */}
                                      <ImageThumbnail
                                        images={displayImages || []}
                                        alt={selectedVariant ? (selectedVariant.variantName || selectedVariant.name) : parent.name}
                                        onOpenGallery={() => openGallery(
                                          displayImages || [], 
                                          selectedVariant ? (selectedVariant.variantName || selectedVariant.name) : parent.name
                                        )}
                                        testId={`img-variant-${parent.id}`}
                                      />
                                      
                                      {/* Checkbox - centered with heading */}
                                      <Checkbox
                                        id={`variant-group-${parent.id}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          if (checked && variants.length > 0) {
                                            // When checking, select the first variant automatically
                                            // The handleVariantSelect will handle removing other branding options
                                            handleVariantSelect(parent.id, variants[0].id);
                                          } else {
                                            // Uncheck - remove any selected variant
                                            handleVariantSelect(parent.id, null);
                                          }
                                        }}
                                        data-testid={`checkbox-variant-${parent.id}`}
                                      />
                                      
                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <label 
                                              htmlFor={`variant-group-${parent.id}`}
                                              className="font-medium cursor-pointer leading-tight"
                                            >
                                              {parent.name}
                                            </label>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs w-fit"
                                              onClick={() => openDetails(parent, variants)}
                                              data-testid={`button-info-${parent.id}`}
                                            >
                                              <Info className="w-3 h-3 mr-1" />
                                              More Info
                                            </Button>
                                          </div>
                                          {selectedVariant ? (
                                            <Badge variant="secondary" className="flex-shrink-0 w-fit">
                                              {formatPrice(selectedVariant.price, parent.name)}
                                            </Badge>
                                          ) : minVariantPrice !== null && (
                                            <Badge variant="secondary" className="flex-shrink-0 w-fit">
                                              From {formatPrice(minVariantPrice, parent.name)}
                                            </Badge>
                                          )}
                                        </div>
                                        {(selectedVariant?.description && selectedVariant.description !== parent.description) || parent.description ? (
                                          <p className="text-sm text-muted-foreground mb-2">
                                            {selectedVariant?.description && selectedVariant.description !== parent.description 
                                              ? selectedVariant.description 
                                              : parent.description}
                                          </p>
                                        ) : null}
                                        {parent.popular && (
                                          <div className="flex justify-end mb-2">
                                            <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-sm font-medium">
                                              <Star className="w-3 h-3 fill-current" />
                                              Popular Upgrade
                                            </span>
                                          </div>
                                        )}
                                        {isSelected && (
                                          <Select
                                            value={selectedVariantId || ""}
                                            onValueChange={(value) => {
                                              if (value) {
                                                handleVariantSelect(parent.id, value);
                                              }
                                            }}
                                          >
                                            <SelectTrigger data-testid={`select-variant-${parent.id}`}>
                                              <SelectValue placeholder="Select option..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {variants.map((variant) => (
                                                <SelectItem key={variant.id} value={variant.id}>
                                                  {variant.variantName || variant.name} - {formatPrice(variant.price, parent.name)}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/configurator/kit')}
                      data-testid="button-back-bottom"
                      className="w-full sm:w-auto !border-2 !border-accent text-accent hover:bg-accent/10"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleContinue}
                      className="bg-accent text-accent-foreground w-full sm:w-auto"
                      data-testid="button-continue"
                    >
                      Continue to Training
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="xl:col-span-1">
              <ConfiguratorSummary />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      <ConfiguratorTutorial page="upgrades" />
      
      <ImageGallery
        images={galleryImages}
        title={galleryTitle}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />

      {selectedUpgrade && (
        <UpgradeDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          upgrade={selectedUpgrade}
          variants={selectedVariants}
        />
      )}
    </div>
  );
}
