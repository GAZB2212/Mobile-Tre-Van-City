import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, ArrowRight } from "lucide-react";
import vanImage1 from "@assets/IMG_8800_1759504961672.jpg";
import vanImage2 from "@assets/IMG_1129_1759504961672.jpg";
import vanImage3 from "@assets/IMG_7127_1759504961672.jpg";

const designCategories = [
  {
    title: "360° Van Design Render",
    description: "Interactive 360-degree view of our professional mobile tyre van conversions",
    type: "video" as const,
    videoSrc: "/assets/ZenoVideo 20_1759504716286.mp4",
    featured: true,
  },
  {
    title: "360° Van Design Render",
    description: "Complete rotating view showcasing premium equipment and interior layout",
    type: "video" as const,
    videoSrc: "/assets/ZenoVideo 14_1759504750775.mp4",
    featured: false,
  },
  {
    title: "360° Van Design Render",
    description: "Full 360-degree render of a finished mobile tyre business setup",
    type: "video" as const,
    videoSrc: "/assets/ZenoVideo 8_1759504750775.mp4",
    featured: false,
  },
  {
    title: "Professional Branding & Interior Layout",
    description: "Custom vinyl wrap designs with optimized equipment storage",
    type: "image" as const,
    imageSrc: vanImage1,
    featured: false,
  },
  {
    title: "Premium Equipment Setup",
    description: "State-of-the-art tyre fitting equipment and professional workspace",
    type: "image" as const,
    imageSrc: vanImage2,
    featured: false,
  },
  {
    title: "Complete Van Conversion",
    description: "Finished mobile tyre van with full branding and equipment installation",
    type: "image" as const,
    imageSrc: vanImage3,
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
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : design.type === 'image' && design.imageSrc ? (
                  <img 
                    src={design.imageSrc} 
                    alt={design.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
          <Link href="/gallery">
            <Button size="lg" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" data-testid="button-view-gallery">
              Explore Full Gallery
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
