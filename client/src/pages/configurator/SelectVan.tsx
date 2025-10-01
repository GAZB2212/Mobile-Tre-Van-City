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
import { ArrowRight, Car, Fuel, Gauge, Settings } from "lucide-react";
import type { Van } from "@shared/schema";

export default function SelectVan() {
  const [, setLocation] = useLocation();
  const { state, setVan } = useConfigurator();

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {vans.map((van) => (
                      <Card 
                        key={van.id} 
                        className={`hover-elevate cursor-pointer ${state.vanId === van.id ? 'ring-2 ring-accent' : ''}`}
                        onClick={() => handleSelectVan(van.id)}
                        data-testid={`card-van-${van.id}`}
                      >
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
                    ))}
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

            <div className="lg:col-span-1">
              <ConfiguratorSummary />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
