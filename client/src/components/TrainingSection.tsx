import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck, Award, Clock } from "lucide-react";
import { Link } from "wouter";

export default function TrainingSection() {
  const trainingFeatures = [
    {
      icon: ShieldCheck,
      title: "REACT Certified",
      description: "Essential for motorway operation and legal compliance",
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Training sessions arranged to suit your business needs",
    },
    {
      icon: Award,
      title: "Expert Instructors",
      description: "Industry-experienced trainers with real-world knowledge",
    },
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4" data-testid="badge-training">
            <GraduationCap className="w-4 h-4 mr-2" />
            Professional Training Included
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-training-title">
            In-House REACT Training
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-training-description">
            Every mobile tyre van purchase includes comprehensive REACT training - a legal requirement for motorway operations and roadside recovery work
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {trainingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover-elevate" data-testid={`card-training-feature-${index}`}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" data-testid={`text-feature-title-${index}`}>
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground" data-testid={`text-feature-description-${index}`}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/training" data-testid="link-training-details">
            <Button size="lg" data-testid="button-learn-training">
              Learn More About Training
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
