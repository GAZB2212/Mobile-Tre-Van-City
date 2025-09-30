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
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center space-y-3"
              data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="w-16 h-16 bg-chart-3 rounded-full flex items-center justify-center shadow-lg">
                <feature.icon className="w-8 h-8 text-black" strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
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