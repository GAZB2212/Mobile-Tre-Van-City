import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const DEFAULT_HERO_VIDEO = "/media/website_hero_1772966773377.mp4";
const CACHE_KEY = "heroVideoUrl";

function getCachedVideoUrl(): string {
  try {
    return sessionStorage.getItem(CACHE_KEY) ?? DEFAULT_HERO_VIDEO;
  } catch {
    return DEFAULT_HERO_VIDEO;
  }
}

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use cached URL immediately — video starts before the query resolves
  const [videoSrc, setVideoSrc] = useState<string>(getCachedVideoUrl);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });

  // Update video src when query resolves (and cache it for next load)
  useEffect(() => {
    const url = settings?.hero_video_url;
    if (!url) return;
    try { sessionStorage.setItem(CACHE_KEY, url); } catch {}
    setVideoSrc(url);
  }, [settings?.hero_video_url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.volume = 0;
    video.play().catch(() => {
      const retry = () => {
        video.play().catch(() => {});
        window.removeEventListener("pointerdown", retry);
        window.removeEventListener("scroll", retry);
      };
      window.addEventListener("pointerdown", retry, { once: true });
      window.addEventListener("scroll", retry, { once: true });
    });
  }, [videoSrc]);

  return (
    <section className="relative bg-[#1a1a1a] min-h-[40vh] sm:min-h-[80vh] py-14 sm:py-32 md:py-40 lg:py-48 overflow-hidden">
      <video
        key={videoSrc}
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ WebkitBackfaceVisibility: "hidden" } as React.CSSProperties}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 sm:mb-8 leading-tight text-white" data-testid="text-hero-headline">
              Building Your Dream Mobile Tyre Business
            </h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/configurator/van">
                <Button
                  size="lg"
                  variant="default"
                  className="w-full sm:w-auto border-green-600 font-semibold bg-[#8bc440e6] text-[#191919]"
                  data-testid="button-configure-van"
                >
                  Configure Your Van
                </Button>
              </Link>
              <Link href="/business-opportunity">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white border-white/30 font-semibold"
                  data-testid="button-learn-more"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
