import { Button } from "@/components/ui/button";
import { Wrench, Palette, Car, Zap } from "lucide-react";
import { ArrowRight } from "lucide-react";

const services = [
  {
    icon: Wrench,
    title: "Van Modification",
    description: "Complete mobile tyre van conversions with professional equipment installation and custom racking systems"
  },
  {
    icon: Palette,
    title: "Van Branding",
    description: "Professional vehicle wrapping and signage to make your mobile business stand out on the road"
  },
  {
    icon: Car,
    title: "Van Supply",
    description: "Source and supply the perfect base vehicle for your mobile tyre business from trusted UK dealers"
  },
  {
    icon: Zap,
    title: "Equipment & Upgrades",
    description: "Premium tyre changing equipment, lighting, CCTV, and security systems for professional operations"
  }
];

export default function ProcessSteps() {
  return (
    <section className="py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6" data-testid="text-process-title">
            Van Modification Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-process-subtitle">
            Complete solutions for building your dream mobile tyre business
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <div key={index} className="group text-center space-y-6" data-testid={`card-service-${index}`}>
              <div className="flex justify-center">
                <div className="w-28 h-28 bg-background rounded-full flex items-center justify-center border-4 border-accent shadow-lg group-hover:scale-110 transition-transform">
                  <service.icon className="w-14 h-14 text-accent" strokeWidth={2} />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed px-2">
                  {service.description}
                </p>
                <Button 
                  variant="ghost" 
                  className="text-accent font-semibold"
                  data-testid={`button-learn-more-${index}`}
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}