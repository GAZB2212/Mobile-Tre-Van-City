import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Image as ImageIcon, ArrowRight } from "lucide-react";

const designCategories = [
  {
    title: "Compact Van Conversions",
    description: "Efficient layouts for smaller vehicles, maximizing every inch of space",
    type: "image" as const,
    featured: true,
  },
  {
    title: "Large Van Builds",
    description: "Full-service mobile workshops with comprehensive equipment setups",
    type: "image" as const,
    featured: false,
  },
  {
    title: "Time-Lapse Build Process",
    description: "Watch a complete van conversion from start to finish",
    type: "video" as const,
    featured: true,
  },
  {
    title: "Interior Layout Options",
    description: "Explore different racking and storage configurations",
    type: "image" as const,
    featured: false,
  },
  {
    title: "Equipment Installation",
    description: "Professional mounting and wiring of tyre equipment",
    type: "video" as const,
    featured: false,
  },
  {
    title: "Branding & Livery",
    description: "Professional vehicle wrapping and signage examples",
    type: "image" as const,
    featured: false,
  },
];

export default function VanDesigns() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            Inspiration
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-designs-title">
            Van Design Gallery
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our collection of design concepts, build processes, and finished conversions to inspire your perfect mobile tyre van
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {designCategories.map((design, index) => (
            <Card 
              key={index} 
              className={`hover-elevate overflow-hidden cursor-pointer ${
                design.featured ? 'sm:col-span-2 lg:col-span-1' : ''
              }`}
              data-testid={`card-design-${index}`}
            >
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center">
                  {design.type === 'video' ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-accent-foreground ml-1" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Video
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <ImageIcon className="w-16 h-16 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors" />
                      <Badge variant="secondary" className="text-xs">
                        Gallery
                      </Badge>
                    </div>
                  )}
                </div>
                {design.featured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-accent text-accent-foreground text-xs">
                      Featured
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base sm:text-lg mb-2" data-testid={`text-design-title-${index}`}>
                  {design.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {design.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" data-testid="button-view-gallery">
            Explore Full Gallery
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
