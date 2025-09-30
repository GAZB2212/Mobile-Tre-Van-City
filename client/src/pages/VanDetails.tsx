import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Car, Fuel, Gauge, Settings, Calendar, CheckCircle, Phone, Mail } from "lucide-react";
import type { Van } from "@shared/schema";

export default function VanDetails() {
  const [, params] = useRoute("/stock/:slug");
  const slug = params?.slug;

  const { data: van, isLoading, error } = useQuery<Van>({
    queryKey: ['/api/vans/slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/vans/slug/${slug}`);
      if (!response.ok) {
        throw new Error('Van not found');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading van details...</p>
        </div>
      </div>
    );
  }

  if (error || !van) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Van Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The van you're looking for doesn't exist or has been sold.
            </p>
            <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/stock">Browse All Vans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/stock" data-testid="link-back-to-stock">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stock
            </Link>
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Image */}
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                {van.heroImage ? (
                  <img
                    src={van.heroImage}
                    alt={van.title}
                    className="w-full h-full object-cover"
                    data-testid="img-van-hero"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-32 h-32 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Van Title and Key Info */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" data-testid="text-van-title">
                      {van.year} {van.make} {van.model}
                    </h1>
                    <p className="text-lg text-muted-foreground">{van.title}</p>
                  </div>
                  <Badge className="bg-accent text-accent-foreground text-sm">
                    {van.specs.size}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card rounded-md border">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-semibold" data-testid="text-van-mileage">{van.mileage.toLocaleString()} miles</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Transmission</p>
                      <p className="font-semibold">{van.specs.transmission}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Fuel className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fuel Type</p>
                      <p className="font-semibold">{van.specs.fuel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Year</p>
                      <p className="font-semibold">{van.year}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Make</span>
                      <span className="font-medium">{van.make}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-medium">{van.model}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Year</span>
                      <span className="font-medium">{van.year}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Mileage</span>
                      <span className="font-medium">{van.mileage.toLocaleString()} miles</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Transmission</span>
                      <span className="font-medium">{van.specs.transmission}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Fuel Type</span>
                      <span className="font-medium">{van.specs.fuel}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium">{van.specs.size}</span>
                    </div>
                    {van.specs.doors && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Doors</span>
                        <span className="font-medium">{van.specs.doors}</span>
                      </div>
                    )}
                    {van.specs.engine && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Engine</span>
                        <span className="font-medium">{van.specs.engine}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Standard Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span>Professional conversion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span>MOT tested</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span>Service history</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span>Ready for immediate use</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span>UK-built quality</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span>Warranty included</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Price and Contact */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* Price Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Price</CardTitle>
                    <div className="mt-2">
                      <p className="text-4xl font-bold text-accent" data-testid="text-van-price">
                        £{(van.price / 100).toLocaleString()}
                      </p>
                      {!van.vatIncluded && (
                        <p className="text-sm text-muted-foreground mt-1">+ VAT</p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      data-testid="button-enquire"
                    >
                      <Link href="/contact">
                        Enquire Now
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="w-full"
                      data-testid="button-configure"
                    >
                      <Link href="/configurator">
                        Configure Similar Van
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Contact Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-card/50 rounded-md border">
                      <Phone className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-sm text-muted-foreground">Call us</p>
                        <p className="font-medium">0800 123 4567</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-card/50 rounded-md border">
                      <Mail className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email us</p>
                        <p className="font-medium">sales@example.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Finance Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Finance Available</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Flexible finance options available from our FCA-authorized partners.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      data-testid="button-finance"
                    >
                      <Link href="/finance">
                        View Finance Options
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Vans */}
      <section className="py-12 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Interested in a Custom Build?
            </h2>
            <p className="text-muted-foreground mb-6">
              Our configurator lets you design your perfect mobile tyre van with your choice of equipment and upgrades.
            </p>
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground" data-testid="button-start-configurator">
              <Link href="/configurator">
                Start Configurator
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
