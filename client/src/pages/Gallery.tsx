import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Image as ImageIcon, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const galleryItems = [
  {
    category: "Complete Builds",
    items: [
      { title: "Compact Van - Full Conversion", type: "image" as const },
      { title: "Large Van - Premium Build", type: "image" as const },
      { title: "Mid-Size Van - Standard Kit", type: "image" as const },
      { title: "Time-Lapse: Start to Finish", type: "video" as const },
    ],
  },
  {
    category: "Interior Layouts",
    items: [
      { title: "Efficient Racking Systems", type: "image" as const },
      { title: "Tool Organization Solutions", type: "image" as const },
      { title: "Equipment Storage Options", type: "image" as const },
      { title: "Layout Walkthrough", type: "video" as const },
    ],
  },
  {
    category: "Equipment Installation",
    items: [
      { title: "Tyre Changer Mounting", type: "image" as const },
      { title: "Balancer Installation", type: "image" as const },
      { title: "Compressor Setup", type: "image" as const },
      { title: "Wiring & Power Systems", type: "video" as const },
    ],
  },
  {
    category: "Branding & Livery",
    items: [
      { title: "Professional Vehicle Wraps", type: "image" as const },
      { title: "Custom Logo Designs", type: "image" as const },
      { title: "Vinyl Graphics Application", type: "image" as const },
      { title: "Before & After Showcase", type: "video" as const },
    ],
  },
];

export default function Gallery() {
  return (
    <div className="min-h-screen bg-background">
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

      {/* Gallery Categories */}
      {galleryItems.map((category, categoryIndex) => (
        <section key={categoryIndex} className={categoryIndex % 2 === 0 ? "py-16 md:py-24" : "py-16 md:py-24 bg-card"}>
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8" data-testid={`text-category-${categoryIndex}`}>
                {category.category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.items.map((item, itemIndex) => (
                  <Card 
                    key={itemIndex} 
                    className="hover-elevate overflow-hidden cursor-pointer"
                    data-testid={`card-gallery-${categoryIndex}-${itemIndex}`}
                  >
                    <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden group">
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        {item.type === 'video' ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 text-accent-foreground ml-0.5" />
                            </div>
                            <Badge variant="secondary" className="text-xs">Video</Badge>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-12 h-12 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors" />
                            <Badge variant="secondary" className="text-xs">Gallery</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2" data-testid={`text-gallery-item-${categoryIndex}-${itemIndex}`}>
                        {item.title}
                      </h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

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
