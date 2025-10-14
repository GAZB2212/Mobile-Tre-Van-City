import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Youtube } from "lucide-react";

export default function YouTubeSection() {
  // Featured YouTube videos - you can update these video IDs
  const videos = [
    {
      id: "dQw4w9WgXcQ", // Replace with your actual YouTube video ID
      title: "Complete Tyre Van Build",
    },
    {
      id: "dQw4w9WgXcQ", // Replace with your actual YouTube video ID
      title: "Van Interior Installation",
    },
    {
      id: "dQw4w9WgXcQ", // Replace with your actual YouTube video ID
      title: "Mobile Tyre Van Tour",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
              <Youtube className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-youtube-heading">
              See Our Vans in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch our latest builds, tours, and installation guides on YouTube. Get an inside look at our mobile tyre van conversions.
            </p>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {videos.map((video, index) => (
              <Card 
                key={index} 
                className="overflow-hidden hover-elevate cursor-pointer group"
                onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                data-testid={`card-youtube-video-${index}`}
              >
                <div className="relative aspect-video bg-muted">
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to default quality thumbnail if max res doesn't exist
                      e.currentTarget.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Youtube className="w-8 h-8 text-accent-foreground" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{video.title}</h3>
                </div>
              </Card>
            ))}
          </div>

          {/* YouTube Channel CTA */}
          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-accent text-accent-foreground"
              onClick={() => window.open('https://www.youtube.com/@yourchannel', '_blank')}
              data-testid="button-youtube-channel"
            >
              <Youtube className="w-5 h-5 mr-2" />
              Visit Our YouTube Channel
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
