import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="relative bg-black min-h-[70vh] sm:min-h-[80vh] py-24 sm:py-32 md:py-40 lg:py-48 overflow-hidden">
      {/* Video Background */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover opacity-100"
        src="/media/ZenoVideo 24_1759239850808.mp4"
      />
      
      {/* Dark overlay for text readability - always visible */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/70 pointer-events-none" />
      
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