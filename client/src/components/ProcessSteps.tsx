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
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 text-foreground" data-testid="text-process-title">
            Modification Your Van
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 max-w-6xl mx-auto">
          {services.slice(0, 3).map((service, index) => (
            <div key={index} className="text-center space-y-4 sm:space-y-6" data-testid={`card-service-${index}`}>
              <div className="flex justify-center">
                <service.icon className="w-16 h-16 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                {service.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {service.description}
              </p>
              <Button variant="link" className="text-foreground hover:text-accent p-0 h-auto" data-testid={`button-learn-more-${index}`}>
                Learn More <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}