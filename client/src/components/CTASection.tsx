import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Phone } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-black opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-primary-foreground" data-testid="text-cta-title">
            Ready to Start Your Mobile Tyre Business?
          </h2>
          <p className="text-xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto">
            Get a custom quote in minutes. Our team will help you choose the perfect setup for your business needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              data-testid="button-get-quote"
            >
              Get Your Quote
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm font-semibold"
              data-testid="button-call-now"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Now: 0800 123 4567
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}