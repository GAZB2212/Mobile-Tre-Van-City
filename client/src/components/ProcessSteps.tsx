import { Card, CardContent } from "@/components/ui/card";
import { Truck, Wrench, Plus, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Truck,
    title: "Choose Van",
    description: "Select from our stock or bring your own vehicle",
    step: "01"
  },
  {
    icon: Wrench,
    title: "Choose Kit",
    description: "Pick the perfect tyre equipment for your business",
    step: "02"
  },
  {
    icon: Plus,
    title: "Upgrades",
    description: "Add lighting, CCTV, racking, and security features",
    step: "03"
  },
  {
    icon: CreditCard,
    title: "Funding",
    description: "Flexible finance options to get you started",
    step: "04"
  }
];

export default function ProcessSteps() {
  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-process-title">
            Simple 4-Step Process
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-process-subtitle">
            From choosing your van to hitting the road, we make it easy to start your mobile tyre business
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative overflow-hidden hover-elevate cursor-pointer group border-accent/20" data-testid={`card-step-${step.step}`}>
              <CardContent className="p-6 text-center">
                <div className="absolute top-4 right-4 text-5xl font-bold text-foreground/10 group-hover:text-accent/20 transition-colors">
                  {step.step}
                </div>
                <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-accent">
                  <step.icon className="w-7 h-7 text-accent" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}