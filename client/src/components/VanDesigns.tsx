import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import vanImage1 from "@assets/IMG_8800_1759504961672.jpg";
import vanImage2 from "@assets/IMG_1129_1759504961672.jpg";
import vanImage3 from "@assets/IMG_7127_1759504961672.jpg";

const DEFAULT_RENDER_VIDEOS = [
  "/media/ZenoVideo 20_1759504716286.mp4",
  "/media/ZenoVideo 14_1759504750775.mp4",
  "/media/ZenoVideo 8_1759504750775.mp4",
];

const IMAGE_DESIGNS = [
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

function AutoplayVideo({ src }: { src: string }) {
  return (
    <video
      className="w-full h-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      style={{ WebkitBackfaceVisibility: "hidden" } as React.CSSProperties}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

export default function VanDesigns() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });

  const renderVideos = [
    settings?.render_video_1_url ?? DEFAULT_RENDER_VIDEOS[0],
    settings?.render_video_2_url ?? DEFAULT_RENDER_VIDEOS[1],
    settings?.render_video_3_url ?? DEFAULT_RENDER_VIDEOS[2],
  ];

  const videoDesigns = renderVideos.map((src, i) => ({
    title: "Realistic Video of Van Artwork Render",
    description: i === 0
      ? "Interactive 360-degree view of our professional mobile tyre van conversions"
      : i === 1
      ? "Complete rotating view showcasing premium equipment and interior layout"
      : "Full 360-degree render of a finished mobile tyre business setup",
    type: "video" as const,
    videoSrc: src,
    featured: i === 0,
  }));

  const allDesigns = [...videoDesigns, ...IMAGE_DESIGNS];

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
          {allDesigns.map((design, index) => (
            <Card
              key={index}
              className={`hover-elevate overflow-hidden cursor-pointer ${
                design.featured ? 'sm:col-span-2 lg:col-span-1' : ''
              }`}
              data-testid={`card-design-${index}`}
            >
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden group">
                {design.type === 'video' ? (
                  <AutoplayVideo src={design.videoSrc} />
                ) : (
                  <img
                    src={design.imageSrc}
                    alt={design.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
