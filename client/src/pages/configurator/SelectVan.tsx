import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ConfiguratorSummary } from "@/components/ConfiguratorSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowRight, Car, Fuel, Gauge, Settings, ChevronDown, ChevronUp } from "lucide-react";
import type { Van } from "@shared/schema";

export default function SelectVan() {
  const [, setLocation] = useLocation();
  const { state, setVan } = useConfigurator();
  const [expandedVan, setExpandedVan] = useState<string | null>(null);

  const { data: vans = [], isLoading } = useQuery<Van[]>({
    queryKey: ['/api/vans'],
  });

  const handleSelectVan = (vanId: string) => {
    setVan(vanId);
    setLocation('/configurator/kit');
  };

  const handleSkipVan = () => {
    setVan(null);
    setLocation('/configurator/kit');
  };

  const toggleExpanded = (vanId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setExpandedVan(expandedVan === vanId ? null : vanId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-page-title">
              Step 1: Select Your Van
            </h1>
            <p className="text-muted-foreground">
              Choose a van from our stock or skip to configure with your own vehicle
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            <div className="xl:col-span-2">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {vans.map((van) => {
                      const isExpanded = expandedVan === van.id;
                      const firstImage = van.heroImage || van.images?.[0];
                      
                      return (
                        <Card 
                          key={van.id} 
                          className={`hover-elevate cursor-pointer overflow-visible ${state.vanId === van.id ? 'ring-2 ring-accent' : ''}`}
                          onClick={() => handleSelectVan(van.id)}
                          data-testid={`card-van-${van.id}`}
                        >
                          {/* Van Image */}
                          {firstImage && (
                            <div className="relative w-full h-48 overflow-hidden rounded-t-md">
                              <img 
                                src={firstImage} 
                                alt={`${van.make} ${van.model}`}
                                className="w-full h-full object-cover"
                                data-testid={`img-van-${van.id}`}
                              />
                            </div>
                          )}

                          <CardHeader className="space-y-0 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" data-testid={`badge-van-year-${van.id}`}>
                                {van.year}
                              </Badge>
                              <p className="text-2xl font-bold text-accent" data-testid={`text-van-price-${van.id}`}>
                                {formatPrice(van.price)}
                              </p>
                            </div>
                            <CardTitle className="text-xl" data-testid={`text-van-title-${van.id}`}>
                              {van.make} {van.model}
                            </CardTitle>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Gauge className="w-4 h-4" />
                                <span data-testid={`text-van-mileage-${van.id}`}>
                                  {van.mileage.toLocaleString()} miles
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Settings className="w-4 h-4" />
                                <span data-testid={`text-van-transmission-${van.id}`}>
                                  {van.specs.transmission}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Fuel className="w-4 h-4" />
                                <span data-testid={`text-van-fuel-${van.id}`}>
                                  {van.specs.fuel}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Car className="w-4 h-4" />
                                <span data-testid={`text-van-size-${van.id}`}>
                                  {van.specs.size}
                                </span>
                              </div>
                            </div>

                            {/* More Info Expandable Section */}
                            {(van.images && van.images.length > 1) || van.description ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="w-full mt-4"
                                  onClick={(e) => toggleExpanded(van.id, e)}
                                  data-testid={`button-more-info-${van.id}`}
                                >
                                  More Info
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 ml-2" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                  )}
                                </Button>

                                {isExpanded && (
                                  <div 
                                    className="mt-4 space-y-4 border-t pt-4"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`expanded-info-${van.id}`}
                                  >
                                    {/* All Images Gallery */}
                                    {van.images && van.images.length > 1 && (
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">All Images</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                          {van.images.map((img, idx) => (
                                            <div 
                                              key={idx} 
                                              className="relative aspect-video overflow-hidden rounded-md border"
                                              data-testid={`img-gallery-${van.id}-${idx}`}
                                            >
                                              <img 
                                                src={img} 
                                                alt={`${van.make} ${van.model} - Image ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Description */}
                                    {van.description && (
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Description</h4>
                                        <p 
                                          className="text-sm text-muted-foreground whitespace-pre-wrap"
                                          data-testid={`text-van-description-${van.id}`}
                                        >
                                          {van.description}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : null}
                            
                            <Button 
                              className="w-full mt-4" 
                              variant={state.vanId === van.id ? "default" : "outline"}
                              data-testid={`button-select-van-${van.id}`}
                            >
                              {state.vanId === van.id ? 'Selected' : 'Select Van'}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={handleSkipVan}
                      data-testid="button-skip-van"
                    >
                      Skip - I Have My Own Van
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="xl:col-span-1">
              <ConfiguratorSummary />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
