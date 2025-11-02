import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ConfiguratorSummary } from "@/components/ConfiguratorSummary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowRight, ArrowLeft, Zap, Package } from "lucide-react";
import type { Kit } from "@shared/schema";

export default function SelectKit() {
  const [, setLocation] = useLocation();
  const { state, setKit } = useConfigurator();

  const { data: kits = [], isLoading } = useQuery<Kit[]>({
    queryKey: ['/api/kits'],
  });

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className={`w-full ${state.kitId === kit.id ? 'bg-accent text-accent-foreground' : 'border-accent text-accent'}`}
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
