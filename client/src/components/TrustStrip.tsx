import { Shield, Truck, MapPin } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "FCA Authorised",
    description: "Regulated finance provider"
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    description: "UK-wide service coverage"
  },
  {
    icon: MapPin,
    title: "UK-Built",
    description: "Manufactured in Britain"
  }
];

export default function TrustStrip() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center space-y-4"
              data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="relative w-20 h-20 bg-background rounded-full flex items-center justify-center border-2 border-accent/40">
                <div className="absolute inset-2 bg-accent/10 rounded-full" />
                <feature.icon className="w-9 h-9 text-accent relative z-10" strokeWidth={2} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}