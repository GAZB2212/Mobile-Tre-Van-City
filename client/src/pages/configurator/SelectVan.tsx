import { useState } from "react";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowRight, Car, Fuel, Gauge, Settings, Info } from "lucide-react";
import type { Van } from "@shared/schema";

export default function SelectVan() {
  const [, setLocation] = useLocation();
  const { state, setVan } = useConfigurator();
  const [modalVan, setModalVan] = useState<Van | null>(null);

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

  const openModal = (van: Van, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setModalVan(van);
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" data-testid="grid-vans">
                    {vans.map((van) => {
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
                                loading="lazy"
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

                            {/* More Info Button */}
                            {(van.heroImage || (van.images && van.images.length > 0) || van.description) ? (
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full mt-4"
                                onClick={(e) => openModal(van, e)}
                                data-testid={`button-more-info-${van.id}`}
                              >
                                <Info className="w-4 h-4 mr-2" />
                                More Info
                              </Button>
                            ) : null}
                            
                            <Button 
                              className={`w-full mt-4 ${state.vanId === van.id ? 'bg-accent text-accent-foreground' : '!border-2 !border-accent text-accent hover:bg-accent/10'}`}
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
                      className="!border-2 !border-accent text-accent hover:bg-accent/10"
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
      
      <ConfiguratorTutorial page="van" />

      {/* Van Details Modal */}
      <Dialog open={!!modalVan} onOpenChange={(open) => !open && setModalVan(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {modalVan && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl" data-testid={`modal-van-title-${modalVan.id}`}>
                  {modalVan.make} {modalVan.model}
                </DialogTitle>
                <DialogDescription data-testid={`modal-van-subtitle-${modalVan.id}`}>
                  {modalVan.year} • {formatPrice(modalVan.price)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image Carousel */}
                {(() => {
                  // Combine heroImage and images array
                  const allImages = [];
                  if (modalVan.heroImage) allImages.push(modalVan.heroImage);
                  if (modalVan.images && modalVan.images.length > 0) {
                    allImages.push(...modalVan.images.filter(img => img !== modalVan.heroImage));
                  }
                  
                  return allImages.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Images ({allImages.length})</h3>
                      <Carousel className="w-full" data-testid={`modal-carousel-${modalVan.id}`}>
                        <CarouselContent>
                          {allImages.map((img, idx) => (
                            <CarouselItem key={idx}>
                              <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                                <img 
                                  src={img} 
                                  alt={`${modalVan.make} ${modalVan.model} - Image ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  data-testid={`modal-carousel-img-${modalVan.id}-${idx}`}
                                  onError={(e) => {
                                    console.error(`Failed to load image: ${img}`);
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {allImages.length > 1 && (
                          <>
                            <CarouselPrevious className="left-2" data-testid={`modal-carousel-prev-${modalVan.id}`} />
                            <CarouselNext className="right-2" data-testid={`modal-carousel-next-${modalVan.id}`} />
                          </>
                        )}
                      </Carousel>
                    </div>
                  ) : null;
                })()}

                {/* Full Specifications */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Mileage:</span>
                        <span className="font-medium" data-testid={`modal-mileage-${modalVan.id}`}>
                          {modalVan.mileage.toLocaleString()} miles
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Transmission:</span>
                        <span className="font-medium" data-testid={`modal-transmission-${modalVan.id}`}>
                          {modalVan.specs.transmission}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Fuel className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Fuel:</span>
                        <span className="font-medium" data-testid={`modal-fuel-${modalVan.id}`}>
                          {modalVan.specs.fuel}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium" data-testid={`modal-size-${modalVan.id}`}>
                          {modalVan.specs.size}
                        </span>
                      </div>
                      {modalVan.specs.engine && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Engine:</span>
                          <span className="font-medium" data-testid={`modal-engine-${modalVan.id}`}>
                            {modalVan.specs.engine}
                          </span>
                        </div>
                      )}
                      {modalVan.specs.doors && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Doors:</span>
                          <span className="font-medium" data-testid={`modal-doors-${modalVan.id}`}>
                            {modalVan.specs.doors}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {modalVan.description && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Description</h3>
                    <p 
                      className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
                      data-testid={`modal-description-${modalVan.id}`}
                    >
                      {modalVan.description}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      handleSelectVan(modalVan.id);
                      setModalVan(null);
                    }}
                    data-testid={`modal-button-select-${modalVan.id}`}
                  >
                    Select This Van
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    variant="outline"
                    className="!border-2 !border-accent text-accent hover:bg-accent/10"
                    onClick={() => setModalVan(null)}
                    data-testid={`modal-button-close-${modalVan.id}`}
                  >
                    Close
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
