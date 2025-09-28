import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Phone } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <Card className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-cta-title">
              Ready to Start Your Mobile Tyre Business?
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              Get a custom quote in minutes. Our team will help you choose the perfect setup for your business needs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-chart-3 hover:bg-chart-3/90 text-black font-semibold text-lg px-8 py-4"
                data-testid="button-get-quote"
              >
                Get Your Quote
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary backdrop-blur-sm font-semibold text-lg px-8 py-4"
                data-testid="button-call-now"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Now: 0800 123 4567
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}