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
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white" data-testid="text-process-title">
            Modification Your Van
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {services.slice(0, 3).map((service, index) => (
            <div key={index} className="text-center space-y-6" data-testid={`card-service-${index}`}>
              <div className="flex justify-center">
                <service.icon className="w-16 h-16 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {service.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
              <button className="text-white hover:text-accent transition-colors font-semibold" data-testid={`button-learn-more-${index}`}>
                Learn More →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}