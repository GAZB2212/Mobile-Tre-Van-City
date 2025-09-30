import { Button } from "@/components/ui/button";
import heroVideo from "@assets/ZenoVideo 24_1759235382881.mp4";

export default function Hero() {
  return (
    <section className="relative bg-black text-primary-foreground py-24 overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/80 to-black/75" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-8xl font-extrabold mb-8 leading-[1.1] tracking-tight" data-testid="text-hero-headline">
            Building Your Dream Mobile Tyre Business
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-primary-foreground/90 max-w-4xl mx-auto font-medium" data-testid="text-hero-subheadline">
            Custom-built vans with premium equipment. UK manufactured, nationwide delivery.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-accent text-accent-foreground font-bold text-lg px-10 py-6 h-auto"
              data-testid="button-configure-van"
            >
              Configure Your Van
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-primary-foreground text-primary-foreground backdrop-blur-sm font-bold text-lg px-10 py-6 h-auto"
              data-testid="button-browse-stock"
            >
              Browse Stock
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}