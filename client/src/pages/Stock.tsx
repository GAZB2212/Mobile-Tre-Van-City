import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Car, Fuel, Gauge, Settings, Calendar, ArrowRight, Search } from "lucide-react";
import type { Van } from "@shared/schema";

export default function Stock() {
  const [makeFilter, setMakeFilter] = useState<string>("");
  const [transmissionFilter, setTransmissionFilter] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const { data: vans = [], isLoading } = useQuery<Van[]>({
    queryKey: ['/api/vans'],
  });

  const uniqueMakes = Array.from(new Set(vans.map(van => van.make))).sort();

  const filteredVans = vans.filter(van => {
    if (makeFilter && van.make !== makeFilter) return false;
    if (transmissionFilter && van.specs.transmission !== transmissionFilter) return false;
    if (maxPrice && van.price > parseInt(maxPrice) * 100) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading our van stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-card to-background border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-stock-title">
              Ready-to-Go Mobile Tyre Vans
            </h1>
            <p className="text-xl text-muted-foreground">
              Browse our selection of professionally converted mobile tyre service vans. All vehicles are fully equipped and ready for business.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Make</label>
              <Select value={makeFilter} onValueChange={setMakeFilter}>
                <SelectTrigger data-testid="select-make-filter">
                  <SelectValue placeholder="All Makes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Makes</SelectItem>
                  {uniqueMakes.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Transmission</label>
              <Select value={transmissionFilter} onValueChange={setTransmissionFilter}>
                <SelectTrigger data-testid="select-transmission-filter">
                  <SelectValue placeholder="All Transmissions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Transmissions</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Max Price (£)</label>
              <Input
                type="number"
                placeholder="Any price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                data-testid="input-max-price-filter"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMakeFilter("");
                  setTransmissionFilter("");
                  setMaxPrice("");
                }}
                data-testid="button-clear-filters"
              >
                <Search className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground" data-testid="text-results-count">
              Showing {filteredVans.length} of {vans.length} vans
            </p>
          </div>
        </div>
      </section>

      {/* Van Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredVans.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No vans found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters to see more results
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMakeFilter("");
                    setTransmissionFilter("");
                    setMaxPrice("");
                  }}
                  data-testid="button-reset-filters"
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVans.map((van) => (
                <Card key={van.id} className="overflow-hidden" data-testid={`card-van-${van.id}`}>
                  {/* Van Image */}
                  <div className="aspect-video bg-muted relative">
                    {van.heroImage ? (
                      <img
                        src={van.heroImage}
                        alt={van.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-van-${van.id}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-20 h-20 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-accent text-accent-foreground">
                        {van.specs.size}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl" data-testid={`text-van-title-${van.id}`}>
                        {van.year} {van.make} {van.model}
                      </CardTitle>
                    </div>
                    <p className="text-2xl font-bold text-accent" data-testid={`text-van-price-${van.id}`}>
                      £{(van.price / 100).toLocaleString()}
                      {!van.vatIncluded && <span className="text-sm font-normal text-muted-foreground ml-1">+ VAT</span>}
                    </p>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{van.mileage.toLocaleString()} miles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{van.specs.transmission}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{van.specs.fuel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{van.year}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button
                      asChild
                      className="w-full bg-accent border-accent text-accent-foreground"
                      data-testid={`button-view-van-${van.id}`}
                    >
                      <Link href={`/stock/${van.slug}`}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We can build a custom mobile tyre van to your exact specifications. Start with our configurator or get in touch with our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="default" asChild className="bg-accent border-accent text-accent-foreground" data-testid="button-configure-custom">
                <Link href="/configurator">
                  Configure Your Van
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-contact-sales">
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
