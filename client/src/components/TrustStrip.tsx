import { Badge } from "@/components/ui/badge";
import { Shield, Truck, MapPin } from "lucide-react";

const badges = [
  {
    icon: Shield,
    text: "FCA Authorised",
    description: "Regulated finance provider"
  },
  {
    icon: Truck,
    text: "Nationwide Delivery",
    description: "UK-wide service coverage"
  },
  {
    icon: MapPin,
    text: "UK-Built",
    description: "Manufactured in Britain"
  }
];

export default function TrustStrip() {
  return (
    <section className="py-12 bg-background border-y">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center space-x-3" data-testid={`badge-${badge.text.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="w-12 h-12 bg-chart-3 rounded-xl flex items-center justify-center">
                <badge.icon className="w-6 h-6 text-black" />
              </div>
              <div>
                <Badge variant="secondary" className="text-sm font-semibold mb-1">
                  {badge.text}
                </Badge>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}