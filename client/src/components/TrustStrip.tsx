import { Shield, Truck, MapPin } from "lucide-react";

const features = [
  {
    icon: Shield,
    number: "01",
    title: "FCA Authorised",
    description: "Regulated finance provider offering flexible funding solutions for your mobile tyre business"
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
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="relative group"
              data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="text-center space-y-6">
                <h2 className="text-8xl font-bold text-accent/10 group-hover:text-accent/20 transition-colors">
                  {feature.number}
                </h2>
                <div className="flex justify-center -mt-2">
                  <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/20">
                    <feature.icon className="w-10 h-10 text-accent-foreground" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="space-y-3 px-4">
                  <h3 className="text-2xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}