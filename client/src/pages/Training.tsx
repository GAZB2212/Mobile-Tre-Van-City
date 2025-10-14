import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  ShieldCheck, 
  Award, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users
} from "lucide-react";
import { Link } from "wouter";

export default function Training() {
  const trainingModules = [
    {
      title: "Highway Code Compliance",
      description: "Understanding legal requirements for motorway operations and roadside recovery",
      duration: "2 hours",
    },
    {
      title: "Vehicle Positioning",
      description: "Safe positioning techniques for maximum protection on live carriageways",
      duration: "3 hours",
    },
    {
      title: "Risk Assessment",
      description: "Dynamic risk assessment skills for varying road and weather conditions",
      duration: "2 hours",
    },
    {
      title: "Emergency Procedures",
      description: "Response protocols for incidents and emergency situations",
      duration: "2 hours",
    },
    {
      title: "Equipment Safety",
      description: "Safe use of recovery equipment and personal protective gear",
      duration: "1.5 hours",
    },
    {
      title: "Practical Assessment",
      description: "Real-world scenarios and hands-on evaluation",
      duration: "3 hours",
    },
  ];

  const benefits = [
    "Legal compliance for motorway operations",
    "Insurance requirement fulfillment",
    "Enhanced driver safety and confidence",
    "Reduced accident and incident risk",
    "Professional certification recognized industry-wide",
    "Ongoing support and refresher options",
  ];

  const requirements = [
    "Valid UK driving license",
    "No medical conditions affecting roadside work",
    "Basic understanding of vehicle operations",
    "Commitment to full training attendance",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4" data-testid="badge-certification">
              <GraduationCap className="w-4 h-4 mr-2" />
              Professional Certification
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">
              REACT Training Programme
            </h1>
            <p className="text-xl text-muted-foreground mb-8" data-testid="text-page-subtitle">
              Comprehensive in-house training for safe and legal motorway operations. Essential certification for all mobile tyre van operators working on UK motorways and high-speed roads.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/configurator">
                <Button size="lg" data-testid="button-start-configurator">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Start Your Van Build
                </Button>
              </Link>
              <Link href="/stock">
                <Button variant="outline" size="lg" data-testid="button-view-stock">
                  View Van Stock
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What is REACT Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-6" data-testid="text-react-title">
              What is REACT Training?
            </h2>
            <p className="text-lg text-muted-foreground mb-4" data-testid="text-react-description-1">
              REACT (Recovery Equipment And Carriageway Training) is the industry-standard qualification for anyone operating on UK motorways and high-speed roads. It's a legal requirement under the Highways Act for roadside recovery and breakdown services.
            </p>
            <p className="text-lg text-muted-foreground" data-testid="text-react-description-2">
              Our comprehensive in-house training programme ensures you're fully certified and confident to operate your mobile tyre van safely and legally from day one.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="card-why-essential">
              <CardHeader>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <CardTitle>Why It's Essential</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Legal requirement for motorway operations in the UK</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Insurance policies require valid certification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Protects you and other road users from serious incidents</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Demonstrates professional competence to customers</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-included">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Full day comprehensive training course</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>All training materials and certification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Practical hands-on assessment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Ongoing support and guidance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Training Modules */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-modules-title">
              Training Modules
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-modules-description">
              Comprehensive curriculum covering all aspects of safe motorway operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainingModules.map((module, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-module-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-duration-${index}`}>
                      <Clock className="w-3 h-3 mr-1" />
                      {module.duration}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" data-testid={`text-module-title-${index}`}>
                    {module.title}
                  </h3>
                  <p className="text-muted-foreground" data-testid={`text-module-description-${index}`}>
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & Requirements */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card data-testid="card-benefits">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Training Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3" data-testid={`item-benefit-${index}`}>
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-requirements">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Entry Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-3" data-testid={`item-requirement-${index}`}>
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4" data-testid="text-cta-title">
            Ready to Start Your Mobile Tyre Business?
          </h2>
          <p className="text-lg text-muted-foreground mb-8" data-testid="text-cta-description">
            Every van purchase includes REACT training - get certified and start earning from day one
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/configurator">
              <Button size="lg" data-testid="button-configure-van">
                <GraduationCap className="w-5 h-5 mr-2" />
                Configure Your Van
              </Button>
            </Link>
            <Link href="/stock">
              <Button variant="outline" size="lg" data-testid="button-browse-stock">
                Browse Van Stock
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
