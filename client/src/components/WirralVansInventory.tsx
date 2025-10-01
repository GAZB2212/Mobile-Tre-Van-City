import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Fuel, Gauge, Calendar, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WirralVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  price: number;
  monthlyPrice?: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  images: string[];
  mainImageIndex?: number;
}

export default function WirralVansInventory() {
  const { data: vehicles = [], isLoading } = useQuery<WirralVehicle[]>({
    queryKey: ['/api/external/mobile-tyre-vehicles'],
    queryFn: async () => {
      const response = await fetch('https://wirralvans.co.uk/api/external/mobile-tyre-vehicles');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      return response.json();
    },
    refetchInterval: 300000, // 5 minutes
    staleTime: 240000, // 4 minutes
  });

  if (isLoading) {
    return (
      <section className="py-12 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Available Commercial Vehicles</h2>
            <p className="text-muted-foreground">View our partner inventory at Wirral Vans</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (vehicles.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Available Commercial Vehicles</h2>
          <p className="text-muted-foreground">
            View our partner inventory at Wirral Vans - Ready for mobile tyre conversion
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            const imageIndex = vehicle.mainImageIndex ?? 0;
            const vehicleImage = vehicle.images[imageIndex] || vehicle.images[0];

            return (
              <Card 
                key={vehicle.id} 
                className="overflow-hidden hover-elevate"
                data-testid={`card-wirral-vehicle-${vehicle.id}`}
              >
                {vehicleImage && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={vehicleImage}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                      data-testid={`img-wirral-vehicle-${vehicle.id}`}
                    />
                  </div>
                )}

                <CardContent className="p-4 space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 
                        className="font-semibold text-lg leading-tight"
                        data-testid={`text-wirral-title-${vehicle.id}`}
                      >
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <p 
                        className="text-2xl font-bold text-accent"
                        data-testid={`text-wirral-price-${vehicle.id}`}
                      >
                        £{(vehicle.price / 100).toLocaleString()}
                      </p>
                      {vehicle.monthlyPrice && (
                        <p className="text-sm text-muted-foreground">
                          or £{(vehicle.monthlyPrice / 100).toLocaleString()}/month
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {vehicle.mileage.toLocaleString()} mi
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{vehicle.fuelType}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{vehicle.year}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                    data-testid={`button-view-wirral-${vehicle.id}`}
                  >
                    <a
                      href={`https://wirralvans.co.uk/vehicles/${vehicle.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Full Details at Wirral Vans
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="default"
            size="lg"
            asChild
            data-testid="button-visit-wirral-vans"
          >
            <a
              href="https://wirralvans.co.uk"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Wirral Vans Website
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
