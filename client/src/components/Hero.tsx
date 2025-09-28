import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Mobile_tyre_van_conversion_372a2d42.png";

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground py-24 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" data-testid="text-hero-headline">
            Custom-Built Mobile Tyre Vans — Ready to Earn from Day One
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90" data-testid="text-hero-subheadline">
            Pick your van, equipment and upgrades. UK build, nationwide delivery.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-chart-3 hover:bg-chart-3/90 text-black font-semibold text-lg px-8 py-4"
              data-testid="button-configure-van"
            >
              Configure Your Van
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary backdrop-blur-sm font-semibold text-lg px-8 py-4"
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