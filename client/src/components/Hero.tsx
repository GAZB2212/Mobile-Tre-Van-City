import { Button } from "@/components/ui/button";
import heroVideo from "@assets/ZenoVideo 24_1759235382881.mp4";

export default function Hero() {
  return (
    <section className="relative bg-accent text-white py-32 overflow-hidden">
      {/* Red gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent/90 to-accent/70" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" data-testid="text-hero-headline">
              Building Your Dream Mobile Tyre Business
            </h1>
            <Button 
              size="lg" 
              className="bg-primary text-white hover:bg-primary/90 font-bold text-lg px-10 py-6 h-auto"
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