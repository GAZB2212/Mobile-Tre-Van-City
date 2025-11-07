import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Image as ImageIcon, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { GalleryItem } from "@shared/schema";

interface GroupedGalleryItems {
  [category: string]: GalleryItem[];
}

export default function Gallery() {
  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery-items'],
  });

  // Group items by category
  const groupedItems = items.reduce<GroupedGalleryItems>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(groupedItems);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Gallery - Van Conversion Portfolio"
        description="Explore our collection of completed mobile tyre van conversions, interior layouts, equipment installations, and professional branding designs. See our quality craftsmanship."
        canonical="/gallery"
      />
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-card to-background border-b py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              Portfolio
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-gallery-title">
              Van Build Gallery
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Explore our collection of completed van conversions, design concepts, and build process videos. 
              Get inspired for your own mobile tyre van project.
            </p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">No gallery items yet. Check back soon!</p>
        </div>
      ) : (
        <>
          {/* Gallery Categories */}
          {categories.map((category, categoryIndex) => (
            <section key={category} className={categoryIndex % 2 === 0 ? "py-16 md:py-24" : "py-16 md:py-24 bg-card"}>
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-8" data-testid={`text-category-${categoryIndex}`}>
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {groupedItems[category].map((item, itemIndex) => (
                      <Card 
                        key={item.id} 
                        className="hover-elevate overflow-hidden cursor-pointer"
                        data-testid={`card-gallery-${categoryIndex}-${itemIndex}`}
                      >
                        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden group">
                          {item.type === 'video' ? (
                            <>
                              <video 
                                src={item.fileUrl} 
                                className="w-full h-full object-cover"
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                poster={item.thumbnailUrl || undefined}
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20">
                                <div className="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Play className="w-6 h-6 text-accent-foreground ml-0.5" />
                                </div>
                                <Badge variant="secondary" className="text-xs">Video</Badge>
                              </div>
                            </>
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
                                  parent.innerHTML = `
                                    <div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                      <span class="text-xs text-muted-foreground">Failed to load</span>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-sm line-clamp-2" data-testid={`text-gallery-item-${categoryIndex}-${itemIndex}`}>
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-accent/5 to-accent/10 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Build Your Own?</h2>
            <p className="text-muted-foreground mb-8">
              Start configuring your perfect mobile tyre van today and join our portfolio of successful conversions
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild data-testid="button-configure">
              <Link href="/configurator/van">
                Configure Your Van
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
