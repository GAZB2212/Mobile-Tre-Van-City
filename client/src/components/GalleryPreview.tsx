import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { GalleryItem } from "@shared/schema";
import { GalleryVideoCard } from "@/components/GalleryVideoCard";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function GalleryPreview() {
  const ref = useScrollReveal();

  const { data: items = [] } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery-items'],
  });

  if (items.length === 0) {
    return null;
  }

  const preview = items.slice(0, 6);

  return (
    <section ref={ref} className="scroll-reveal py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            Gallery
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-gallery-preview-title">
            Our Work
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore completed van conversions, custom branding, and professional equipment installations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {preview.map((item, index) => (
            <Card key={item.id} className="hover-elevate overflow-hidden" data-testid={`card-gallery-preview-${index}`}>
              <div className="aspect-video bg-muted relative overflow-hidden group">
                {item.type === 'video' ? (
                  <GalleryVideoCard
                    fileUrl={item.fileUrl}
                    title={item.title}
                    storedThumbnailUrl={item.thumbnailUrl}
                  />
                ) : (
                  <img
                    src={item.fileUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="absolute inset-0 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/40"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;
                      }
                    }}
                  />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm sm:text-base line-clamp-1" data-testid={`text-gallery-item-${index}`}>
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                {item.category && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {item.category}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="!border-2 !border-accent text-accent hover:bg-accent/10" asChild data-testid="button-view-gallery">
            <Link href="/gallery">
              View Full Gallery
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
