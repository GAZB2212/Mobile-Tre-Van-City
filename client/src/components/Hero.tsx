import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroPoster from "@assets/IMG_1103_1759503549443.jpg";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const attemptPlay = () => {
      video.muted = true;
      video.play().catch(() => {
        // Autoplay blocked — try again on first user interaction
        const onInteraction = () => {
          video.play().catch(() => {});
          document.removeEventListener("click", onInteraction);
          document.removeEventListener("touchstart", onInteraction);
        };
        document.addEventListener("click", onInteraction, { once: true });
        document.addEventListener("touchstart", onInteraction, { once: true });
      });
    };

    if (video.readyState >= 3) {
      attemptPlay();
    } else {
      video.addEventListener("canplay", attemptPlay, { once: true });
    }

    return () => {
      video.removeEventListener("canplay", attemptPlay);
    };
  }, []);

  return (
    <section className="relative bg-black min-h-[70vh] sm:min-h-[80vh] py-24 sm:py-32 md:py-40 lg:py-48 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={heroPoster}
        className="absolute inset-0 w-full h-full object-cover"
        src="/media/website_hero_1772966773377.mp4"
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
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white border-white/30 font-semibold"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
