import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Youtube } from "lucide-react";

export default function YouTubeSection() {
  // Featured YouTube videos
  const videos = [
    {
      id: "WvzIc724GFk",
      title: "Mobile Tyre Van Build",
    },
    {
      id: "eIIBJPSylaI",
      title: "Van Interior Installation",
    },
    {
      id: "ZK4KIOkK1jI",
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
                className="overflow-hidden"
                data-testid={`card-youtube-video-${index}`}
              >
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&loop=1&playlist=${video.id}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
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
              onClick={() => window.open('https://www.youtube.com/@mobiletyrevancity', '_blank')}
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
