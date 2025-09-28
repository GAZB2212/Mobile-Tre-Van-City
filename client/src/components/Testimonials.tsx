import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export default function Testimonials() {
  // todo: remove mock functionality
  const testimonials = [
    {
      id: 1,
      name: "James Mitchell",
      company: "Mobile Tyre Solutions Ltd",
      content: "Outstanding service and quality. The van conversion exceeded our expectations and we were earning from day one.",
      rating: 5,
      initials: "JM"
    },
    {
      id: 2,
      name: "Sarah Williams", 
      company: "TyreFix Mobile",
      content: "Professional setup, great finance options, and excellent ongoing support. Highly recommend for anyone starting out.",
      rating: 5,
      initials: "SW"
    },
    {
      id: 3,
      name: "David Thompson",
      company: "Thompson Tyres",
      content: "Quality equipment and van conversion. The team guided us through every step of the process.",
      rating: 5,
      initials: "DT"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-testimonials-title">
            What Our Customers Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of successful mobile tyre businesses across the UK
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover-elevate" data-testid={`card-testimonial-${testimonial.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-chart-3 text-chart-3" />
                  ))}
                </div>
                
                <blockquote className="text-muted-foreground mb-6 italic">
                  "{testimonial.content}"
                </blockquote>
                
                <div className="flex items-center">
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarFallback className="bg-chart-3 text-black font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm" data-testid={`text-customer-name-${testimonial.id}`}>
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}