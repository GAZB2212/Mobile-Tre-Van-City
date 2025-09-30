import StockCard from "./StockCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import stockImage from "@assets/generated_images/Mobile_tyre_van_conversion_372a2d42.png";

export default function FeaturedStock() {
  // todo: remove mock functionality
  const featuredVans = [
    {
      id: "van-001",
      title: "Mobile Tyre Van - Ready to Go",
      make: "Ford",
      model: "Transit Custom",
      year: 2022,
      mileage: 15000,
      price: 4500000,
      vatIncluded: false,
      imageUrl: stockImage,
      specs: {
        transmission: "Manual",
        size: "LWB",
        fuel: "Diesel"
      }
    },
    {
      id: "van-002", 
      title: "Premium Mobile Workshop",
      make: "Mercedes",
      model: "Sprinter",
      year: 2023,
      mileage: 8500,
      price: 5200000,
      vatIncluded: false,
      imageUrl: stockImage,
      specs: {
        transmission: "Automatic",
        size: "LWB",
        fuel: "Diesel"
      }
    },
    {
      id: "van-003",
      title: "Compact Tyre Service Van",
      make: "Volkswagen", 
      model: "Crafter",
      year: 2021,
      mileage: 22000,
      price: 3800000,
      vatIncluded: false,
      imageUrl: stockImage,
      specs: {
        transmission: "Manual",
        size: "SWB",
        fuel: "Diesel"
      }
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white" data-testid="text-featured-title">
              Featured Stock
            </h2>
            <p className="text-lg text-muted-foreground">
              Ready-to-go mobile tyre vans from our current inventory
            </p>
          </div>
          <Button variant="outline" size="lg" className="hidden md:flex border-accent text-accent hover:bg-accent hover:text-white" data-testid="button-view-all-stock">
            View All Stock
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featuredVans.map((van) => (
            <StockCard key={van.id} {...van} />
          ))}
        </div>
        
        <div className="text-center md:hidden">
          <Button variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-white" data-testid="mobile-button-view-all-stock">
            View All Stock
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}