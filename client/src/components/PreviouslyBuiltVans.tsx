import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle } from "lucide-react";
import type { Quote } from "@shared/schema";

export default function PreviouslyBuiltVans() {
  const { data: completedBuilds = [] } = useQuery<Quote[]>({
    queryKey: ['/api/quotes/completed'],
    queryFn: async () => {
      const response = await fetch('/api/quotes/completed');
      if (!response.ok) return [];
      return response.json();
    },
  });

  if (completedBuilds.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            Portfolio
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-portfolio-title">
            Previously Built Vans
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            See the quality craftsmanship and professional conversions we've delivered to satisfied customers across the UK
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {completedBuilds.slice(0, 6).map((build, index) => (
            <Card key={build.id} className="hover-elevate overflow-hidden" data-testid={`card-completed-build-${index}`}>
              <div className="aspect-video bg-muted relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                  <CheckCircle className="w-16 h-16 text-accent" />
                </div>
                <div className="absolute bottom-2 right-2">
                  <Badge variant="default" className="bg-accent text-accent-foreground">
                    Completed
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base sm:text-lg truncate" data-testid={`text-build-name-${index}`}>
                    {build.userName}'s Build
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  Custom mobile tyre van conversion with professional equipment installation
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" asChild data-testid="button-view-all-builds">
            <Link href="/portfolio">
              View Full Portfolio
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
