import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { 
  GraduationCap, 
  ShieldCheck, 
  Award, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Wrench,
  CarFront
} from "lucide-react";
import { Link } from "wouter";

export default function Training() {
  const reactModules = [
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

  const tyreFittingModules = [
    {
      title: "Tyre Technology & Construction",
      description: "Understanding tyre types, ratings, and construction methods",
      duration: "2 hours",
    },
    {
      title: "Mobile Fitting Techniques",
      description: "Professional tyre fitting and removal in roadside environments",
      duration: "4 hours",
    },
    {
      title: "Wheel Balancing",
      description: "Precision balancing techniques for all vehicle types",
      duration: "2 hours",
    },
    {
      title: "Puncture Repair",
      description: "Professional puncture assessment and repair procedures",
      duration: "1.5 hours",
    },
    {
      title: "TPMS Systems",
      description: "Tyre pressure monitoring system diagnostics and programming",
      duration: "2 hours",
    },
    {
      title: "Customer Service",
      description: "Professional service delivery and customer communication",
      duration: "1.5 hours",
    },
  ];

  const trainingBenefits = [
    "Full legal compliance for motorway and roadside operations",
    "Professional certification recognized across the industry",
    "Comprehensive tyre fitting and repair expertise",
    "Enhanced safety for you and your customers",
    "Insurance requirements fully satisfied",
    "Ongoing support and refresher training available",
  ];

  const requirements = [
    "Valid UK driving license",
    "No medical conditions affecting roadside work",
    "Basic understanding of vehicle operations",
    "Commitment to full training attendance",
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Training Programme - REACT & Tyre Fitting Certification"
        description="Comprehensive in-house training covering REACT motorway certification and professional tyre fitting. Full legal compliance, professional certification, and ongoing support included with every van."
        canonical="/training"
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4" data-testid="badge-certification">
              <GraduationCap className="w-4 h-4 mr-2" />
              Professional Certification Included
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">
              Complete Training Programme
            </h1>
            <p className="text-xl text-muted-foreground mb-8" data-testid="text-page-subtitle">
              Comprehensive in-house training covering both REACT motorway certification and professional tyre fitting. Everything you need to start your mobile tyre business with confidence.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/configurator/van">
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

      {/* Training Overview */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-primary/20" data-testid="card-react-overview">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">REACT Training</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Recovery Equipment And Carriageway Training (REACT) is the industry-standard qualification and legal requirement for operating on UK motorways and high-speed roads.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Legal requirement for motorway operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Essential for insurance coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Industry-recognized certification</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-accent/20" data-testid="card-tyre-overview">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Wrench className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">Tyre Fitting Training</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Professional tyre fitting training covering all aspects of mobile tyre services, from basic fitting to advanced TPMS diagnostics and customer service excellence.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Comprehensive fitting techniques</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Advanced TPMS programming</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Professional service standards</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* REACT Training Modules */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4" data-testid="text-react-modules-title">
              REACT Training Modules
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-react-modules-description">
              Essential certification for safe and legal motorway operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reactModules.map((module, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-react-module-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-react-duration-${index}`}>
                      <Clock className="w-3 h-3 mr-1" />
                      {module.duration}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" data-testid={`text-react-module-title-${index}`}>
                    {module.title}
                  </h3>
                  <p className="text-muted-foreground" data-testid={`text-react-module-description-${index}`}>
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tyre Fitting Training Modules */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <Wrench className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-3xl font-bold mb-4" data-testid="text-tyre-modules-title">
              Tyre Fitting Training Modules
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-tyre-modules-description">
              Professional mobile tyre fitting and service expertise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tyreFittingModules.map((module, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-tyre-module-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-accent">{index + 1}</span>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-tyre-duration-${index}`}>
                      <Clock className="w-3 h-3 mr-1" />
                      {module.duration}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" data-testid={`text-tyre-module-title-${index}`}>
                    {module.title}
                  </h3>
                  <p className="text-muted-foreground" data-testid={`text-tyre-module-description-${index}`}>
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & Requirements */}
      <section className="py-16 px-4 bg-muted/30">
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
                  {trainingBenefits.map((benefit, index) => (
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

      {/* What's Included */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-included-title">
              What's Included With Every Van Purchase
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete training package to get you operational from day one
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate" data-testid="card-full-certification">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Full Certification</h3>
                <p className="text-muted-foreground">
                  Both REACT and tyre fitting certifications included with all training materials
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-hands-on">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <CarFront className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Hands-On Practice</h3>
                <p className="text-muted-foreground">
                  Real-world practical training with professional equipment and scenarios
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-ongoing-support">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ongoing Support</h3>
                <p className="text-muted-foreground">
                  Continued guidance and access to refresher training whenever you need it
                </p>
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
            Every van purchase includes complete REACT and tyre fitting training - get certified and start earning from day one
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/configurator/van">
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
