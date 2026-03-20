import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroImagePath from "@assets/IMG_5586_2_1774013208123.JPG";

export default function Hero() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });

  return (
    <section className="relative bg-[#1a1a1a] min-h-[40vh] sm:min-h-[80vh] py-14 sm:py-32 md:py-40 lg:py-48 overflow-hidden">
      {/* Hero Image Background */}
      <img
        src={heroImagePath}
        alt="Mobile tyre van interior"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20 pointer-events-none" />

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
