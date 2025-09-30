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
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight" data-testid="text-hero-headline">
            Custom-Built Mobile Tyre Vans — Ready to Earn from Day One
          </h1>
          <p className="text-lg md:text-xl mb-10 text-primary-foreground/90 max-w-3xl mx-auto" data-testid="text-hero-subheadline">
            Pick your van, equipment and upgrades. UK build, nationwide delivery.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              data-testid="button-configure-van"
            >
              Configure Your Van
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm font-semibold"
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