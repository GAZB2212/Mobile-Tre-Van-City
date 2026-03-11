import { useLocation } from "wouter";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ConfiguratorSummary } from "@/components/ConfiguratorSummary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Car, Truck, Layers } from "lucide-react";
import type { KitServiceType } from "@shared/schema";

const SERVICE_TYPES: {
  value: KitServiceType;
  label: string;
  description: string;
  detail: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "car",
    label: "Car & Van Tyres",
    description: "Passenger cars, vans & SUVs",
    detail:
      "Your kit will be configured for fitting standard car and light-van tyres, up to and including commercial vans (e.g. Ford Transit, Sprinter).",
    Icon: Car,
  },
  {
    value: "commercial",
    label: "Commercial Vehicles",
    description: "HGVs, lorries & large fleet",
    detail:
      "Your kit will be set up for heavy goods vehicles, buses and large commercial fleet tyres requiring higher-capacity equipment.",
    Icon: Truck,
  },
  {
    value: "hybrid",
    label: "Hybrid — Both",
    description: "Car/van and commercial combined",
    detail:
      "A dual-purpose setup that lets you handle both standard car/van tyres and commercial vehicles from a single conversion.",
    Icon: Layers,
  },
];

export default function SelectServiceType() {
  const [, setLocation] = useLocation();
  const { state, setServiceType } = useConfigurator();

  const handleSelect = (type: KitServiceType) => {
    setServiceType(type);
    setLocation("/configurator/kit");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/configurator/van")}
            className="mb-4 gap-2"
            data-testid="button-back-to-van"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Van Selection
          </Button>
          <h1
            className="text-3xl md:text-4xl font-bold mb-2 mt-4"
            data-testid="text-page-title"
          >
            Step 2: Choose Your Service Type
          </h1>
          <p className="text-muted-foreground">
            Tell us what type of vehicles your mobile tyre service will cover
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="grid-service-types">
              {SERVICE_TYPES.map(({ value, label, description, detail, Icon }) => {
                const isSelected = state.serviceType === value;
                return (
                  <Card
                    key={value}
                    className={`cursor-pointer hover-elevate transition-all ${
                      isSelected ? "ring-2 ring-accent" : ""
                    }`}
                    onClick={() => handleSelect(value)}
                    data-testid={`card-service-type-${value}`}
                  >
                    <CardContent className="p-6 flex flex-col gap-4 h-full">
                      <div
                        className={`w-12 h-12 rounded-md flex items-center justify-center ${
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex-1">
                        <h2 className="text-lg font-semibold mb-1">{label}</h2>
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          {description}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {detail}
                        </p>
                      </div>

                      <Button
                        className={`w-full mt-2 ${
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "!border-2 !border-accent text-accent hover:bg-accent/10"
                        }`}
                        variant={isSelected ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(value);
                        }}
                        data-testid={`button-select-service-type-${value}`}
                      >
                        {isSelected ? (
                          <>
                            Selected — Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          "Select"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-1">
            <ConfiguratorSummary />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
