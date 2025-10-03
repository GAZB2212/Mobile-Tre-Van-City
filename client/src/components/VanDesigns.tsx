import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Image as ImageIcon, ArrowRight } from "lucide-react";
import video1 from "@assets/ZenoVideo 20_1759504716286.mp4";
import video2 from "@assets/ZenoVideo 14_1759504750775.mp4";
import video3 from "@assets/ZenoVideo 8_1759504750775.mp4";

const designCategories = [
  {
    title: "Professional Van Conversion Showcase",
    description: "See our expertly crafted mobile tyre van conversions in action",
    type: "video" as const,
    videoSrc: video1,
    featured: true,
  },
  {
    title: "Custom Build Features",
    description: "Detailed walkthrough of premium equipment installations and layouts",
    type: "video" as const,
    videoSrc: video2,
    featured: false,
  },
  {
    title: "Complete Van Setup",
    description: "Full tour of a finished mobile tyre business on wheels",
    type: "video" as const,
    videoSrc: video3,
    featured: false,
  },
  {
    title: "Interior Layout Options",
    description: "Explore different racking and storage configurations",
    type: "image" as const,
    featured: false,
  },
  {
    title: "Branding & Livery",
    description: "Professional vehicle wrapping and signage examples",
    type: "image" as const,
    featured: false,
  },
  {
    title: "Equipment Installation",
    description: "Professional mounting and wiring of tyre equipment",
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
                {design.type === 'video' && design.videoSrc ? (
                  <video 
                    src={design.videoSrc} 
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <ImageIcon className="w-16 h-16 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors" />
                      <Badge variant="secondary" className="text-xs">
                        Gallery
                      </Badge>
                    </div>
                  </div>
                )}
                {design.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-accent-foreground ml-1" />
                    </div>
                  </div>
                )}
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
