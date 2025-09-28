import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConfiguratorStepper from "@/components/ConfiguratorStepper";
import EquipmentGrid from "@/components/EquipmentGrid";
import PriceSummary from "@/components/PriceSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Configurator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const [showVAT, setShowVAT] = useState(true);

  const handleRequestQuote = () => {
    console.log('Quote requested for configurator');
    // todo: remove mock functionality - implement actual quote request
  };

  // todo: remove mock functionality
  const basePrice = 4500000; // £45,000
  const kitPrices: Record<string, number> = {
    starter: 1250000,
    professional: 1850000,
    premium: 2450000
  };
  const kitPrice = selectedKit ? kitPrices[selectedKit] : 0;
  const upgradesPrice = 750000; // £7,500

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
                  {/* Base van selection would go here */}
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

            {currentStep === 2 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Choose Your Equipment Kit</h2>
                  <p className="text-muted-foreground">
                    Select the tyre changing equipment that best fits your business needs
                  </p>
                </div>
                <EquipmentGrid 
                  selectedKit={selectedKit} 
                  onKitSelect={setSelectedKit}
                />
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

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Upgrades & Extras</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Enhance your van with additional features like lighting, CCTV, racking, and security.
                  </p>
                  {/* Upgrades grid would go here */}
                  <div className="flex gap-4">
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
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Review your configuration and request a detailed quote.
                  </p>
                  {/* Summary details would go here */}
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
              basePrice={basePrice}
              kitPrice={kitPrice}
              upgradesPrice={upgradesPrice}
              showVAT={showVAT}
              onVATToggle={setShowVAT}
              onRequestQuote={handleRequestQuote}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}