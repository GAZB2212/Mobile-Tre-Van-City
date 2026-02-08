import { Shield, Truck, MapPin } from "lucide-react";

const features = [
  {
    icon: Shield,
    number: "01",
    title: "Quality Assured",
    description: "Professional van conversions built to the highest standards with premium materials"
  },
  {
    icon: Truck,
    number: "02",
    title: "Nationwide Delivery",
    description: "Complete UK-wide service coverage with professional delivery and handover support"
  },
  {
    icon: MapPin,
    number: "03",
    title: "UK-Built",
    description: "Manufactured in Britain with premium British craftsmanship and quality materials"
  }
];

export default function TrustStrip() {
  return (
    <section className="py-8 sm:py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="text-center space-y-3"
              data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex justify-center mb-2">
                <feature.icon className="w-12 h-12 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed px-2">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}