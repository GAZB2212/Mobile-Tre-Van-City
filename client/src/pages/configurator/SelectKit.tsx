import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ConfiguratorSummary } from "@/components/ConfiguratorSummary";
import { ConfiguratorTutorial } from "@/components/ConfiguratorTutorial";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, ArrowLeft, Zap, Package, Info, CheckCircle, AlertCircle } from "lucide-react";
import type { Kit, Van } from "@shared/schema";

export default function SelectKit() {
  const [, setLocation] = useLocation();
  const { state, setKit } = useConfigurator();
  const [modalKit, setModalKit] = useState<Kit | null>(null);

  const { data: allKits = [], isLoading } = useQuery<Kit[]>({
    queryKey: ['/api/kits'],
  });

  // Fetch van data if van is selected
  const { data: van } = useQuery<Van>({
    queryKey: ['/api/vans', state.vanId],
    queryFn: async () => {
      const res = await fetch(`/api/vans/${state.vanId}`);
      if (!res.ok) throw new Error('Failed to fetch van');
      return res.json();
    },
    enabled: !!state.vanId,
  });

  // Filter kits based on van's Euro status
  const { filteredKits: kits, filterMessage } = useMemo(() => {
    if (!van?.euroStatus) {
      // If no van selected or no euro status, show all kits
      return { filteredKits: allKits, filterMessage: null };
    }

    // Check if van is Euro 6
    const isEuro6 = van.euroStatus.toLowerCase().includes('euro 6') || 
                   van.euroStatus.toLowerCase().includes('euro6');

    // Filter kits based on compatibility
    const filtered = allKits.filter(kit => kit.euroSixCompatible === isEuro6);

    // If no kits match the filter, show all kits with a warning message
    if (filtered.length === 0) {
      return {
        filteredKits: allKits,
        filterMessage: {
          type: 'warning' as const,
          title: `Limited ${van.euroStatus} Options Available`,
          description: `Your ${van.make} ${van.model} requires ${van.euroStatus} compatible equipment, but we currently have limited stock. Showing all available kits - please contact us to confirm compatibility.`
        }
      };
    }

    // Return filtered kits with success message
    return {
      filteredKits: filtered,
      filterMessage: {
        type: 'info' as const,
        title: `Showing ${van.euroStatus} Compatible Equipment`,
        description: `Based on your ${van.make} ${van.model}'s emissions standard, we're showing kits specifically designed for ${van.euroStatus} vehicles.`
      }
    };
  }, [allKits, van]);

  const handleSelectKit = (kitId: string) => {
    setKit(kitId);
    setLocation('/configurator/upgrades');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const openModal = (kit: Kit, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalKit(kit);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/configurator/van')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Van Selection
            </Button>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-2 mt-4" data-testid="text-page-title">
              Step 2: Choose Your Equipment Kit
            </h1>
            <p className="text-muted-foreground">
              Select the perfect equipment package for your mobile tyre business
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
                  {/* Euro Status Filter Message */}
                  {filterMessage && (
                    <div className={`mb-6 p-4 rounded-md flex items-start gap-3 ${
                      filterMessage.type === 'warning' 
                        ? 'bg-destructive/10 border border-destructive/20' 
                        : 'bg-accent/10 border border-accent/20'
                    }`}>
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        filterMessage.type === 'warning' ? 'text-destructive' : 'text-accent'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {filterMessage.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {filterMessage.description}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="grid-kits">
                    {kits.map((kit) => (
                      <Card 
                        key={kit.id} 
                        className={`hover-elevate cursor-pointer ${state.kitId === kit.id ? 'ring-2 ring-accent' : ''}`}
                        onClick={() => handleSelectKit(kit.id)}
                        data-testid={`card-kit-${kit.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="secondary" className="flex items-center gap-1" data-testid={`badge-kit-power-${kit.id}`}>
                              <Zap className="w-3 h-3" />
                              {kit.powerKw}kW
                            </Badge>
                            <p className="text-2xl font-bold text-accent" data-testid={`text-kit-price-${kit.id}`}>
                              {formatPrice(kit.price)}
                            </p>
                          </div>
                          <CardTitle className="text-xl" data-testid={`text-kit-name-${kit.id}`}>
                            {kit.name}
                          </CardTitle>
                          <CardDescription data-testid={`text-kit-description-${kit.id}`}>
                            {kit.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Package className="w-4 h-4 text-accent" />
                              <span>Includes:</span>
                            </div>
                            <ul className="space-y-1 ml-6">
                              {kit.includes.map((item, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground list-disc" data-testid={`text-kit-includes-${kit.id}-${idx}`}>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full mb-2"
                            onClick={(e) => openModal(kit, e)}
                            data-testid={`button-more-info-${kit.id}`}
                          >
                            <Info className="w-4 h-4 mr-2" />
                            More Info
                          </Button>
                          
                          <Button 
                            className={`w-full ${state.kitId === kit.id ? 'bg-accent text-accent-foreground' : '!border-2 !border-accent text-accent hover:bg-accent/10'}`}
                            variant={state.kitId === kit.id ? "default" : "outline"}
                            data-testid={`button-select-kit-${kit.id}`}
                          >
                            {state.kitId === kit.id ? 'Selected' : 'Select Kit'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
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
      
      <ConfiguratorTutorial page="kit" />

      {/* Kit Details Modal */}
      <Dialog open={!!modalKit} onOpenChange={(open) => !open && setModalKit(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {modalKit && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl" data-testid={`modal-kit-title-${modalKit.id}`}>
                  {modalKit.name}
                </DialogTitle>
                <DialogDescription data-testid={`modal-kit-subtitle-${modalKit.id}`}>
                  {modalKit.powerKw}kW • {formatPrice(modalKit.price)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image Carousel */}
                {modalKit.images && modalKit.images.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Images ({modalKit.images.length})</h3>
                    <Carousel className="w-full" data-testid={`modal-carousel-${modalKit.id}`}>
                      <CarouselContent>
                        {modalKit.images.map((img, idx) => (
                          <CarouselItem key={idx}>
                            <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                              <img 
                                src={img} 
                                alt={`${modalKit.name} - Image ${idx + 1}`}
                                className="w-full h-full object-cover"
                                data-testid={`modal-carousel-img-${modalKit.id}-${idx}`}
                                onError={(e) => {
                                  console.error(`Failed to load image: ${img}`);
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {modalKit.images.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2" data-testid={`modal-carousel-prev-${modalKit.id}`} />
                          <CarouselNext className="right-2" data-testid={`modal-carousel-next-${modalKit.id}`} />
                        </>
                      )}
                    </Carousel>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Description</h3>
                  <p className="text-muted-foreground" data-testid={`modal-kit-description-${modalKit.id}`}>
                    {modalKit.description}
                  </p>
                </div>

                {/* Full Includes List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-accent" />
                    Complete Equipment List
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {modalKit.includes.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span data-testid={`modal-kit-includes-${modalKit.id}-${idx}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Specifications */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Key Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-accent" />
                        <span className="text-muted-foreground">Power Output:</span>
                        <span className="font-medium" data-testid={`modal-kit-power-${modalKit.id}`}>
                          {modalKit.powerKw}kW
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t">
                  <Button
                    className="w-full bg-accent text-accent-foreground"
                    onClick={() => {
                      handleSelectKit(modalKit.id);
                      setModalKit(null);
                    }}
                    data-testid={`modal-button-select-kit-${modalKit.id}`}
                  >
                    {state.kitId === modalKit.id ? 'Selected - Continue' : 'Select This Kit'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
