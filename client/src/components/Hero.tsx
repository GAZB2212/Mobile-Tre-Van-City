import { Button } from "@/components/ui/button";
import heroVideo from "@assets/ZenoVideo 24_1759239850808.mp4";

export default function Hero() {
  return (
    <section className="relative bg-background text-white py-40 overflow-hidden">
      {/* Video Background */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/60" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" data-testid="text-hero-headline">
              Building Your Dream Mobile Tyre Business
            </h1>
            <Button 
              size="lg" 
              className="bg-primary text-white hover:bg-primary/90 font-semibold"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}