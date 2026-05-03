import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UKManufacturing from "@/components/UKManufacturing";
import ProcessSteps from "@/components/ProcessSteps";
import EarningsPotential from "@/components/EarningsPotential";
import TrainingSection from "@/components/TrainingSection";
import TrustStrip from "@/components/TrustStrip";
import FeaturedStock from "@/components/FeaturedStock";
import GalleryPreview from "@/components/GalleryPreview";
import VanDesigns from "@/components/VanDesigns";
import Testimonials from "@/components/Testimonials";
import YouTubeSection from "@/components/YouTubeSection";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
import HomeEnquiryForm from "@/components/HomeEnquiryForm";
import Footer from "@/components/Footer";
import SEO, { buildOrganizationStructuredData, homeFaqStructuredData } from "@/components/SEO";

const KEY_CITIES = [
  "Liverpool", "Manchester", "Birmingham", "London", "Leeds",
  "Glasgow", "Sheffield", "Bristol", "Newcastle", "Cardiff",
  "Nottingham", "Leicester", "Edinburgh", "Coventry", "Bradford",
];

function DeliveryAreasSection() {
  return (
    <section className="py-14 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-delivery-heading">
              We Deliver Across the UK
            </h2>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Van conversions delivered to 76 areas — from the Wirral to your door
            </p>
          </div>
          <Link href="/mobile-tyre-vans" className="shrink-0">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline" data-testid="link-view-all-areas">
              View all delivery areas <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {KEY_CITIES.map((city) => (
            <Link
              key={city}
              href={`/mobile-tyre-vans/${city.toLowerCase()}`}
              data-testid={`link-city-${city.toLowerCase()}`}
            >
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-background border border-border text-sm text-foreground hover-elevate transition-colors">
                <MapPin className="w-3 h-3 text-accent shrink-0" />
                {city}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreFooterCTA() {
  return (
    <section className="py-16 bg-accent" data-testid="section-prefooter-cta">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-accent-foreground mb-3" data-testid="text-prefooter-headline">
          Ready to get started?
        </h2>
        <p className="text-accent-foreground/80 text-base sm:text-lg mb-8 max-w-xl mx-auto">
          Build your fully-equipped mobile tyre van today and start earning from day one.
        </p>
        <Button
          size="lg"
          className="bg-accent-foreground text-accent font-bold hover:bg-accent-foreground/90"
          asChild
          data-testid="button-prefooter-configure"
        >
          <Link href="/configurator/van">Configure Your Van</Link>
        </Button>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: ratingSummary } = useQuery<{ count: number; averageRating: number }>({
    queryKey: ["/api/testimonials/rating-summary"],
  });

  const orgSchema = buildOrganizationStructuredData(ratingSummary);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Mobile Tyre Van Conversions UK | Mobile Tyre Van City"
        description="UK specialists in custom mobile tyre van conversions. Fully equipped builds, nationwide delivery, finance available. Based in Wirral. Call 0151 203 8500."
        canonical="/"
        keywords="mobile tyre van, tyre van conversion, mobile tyre fitting van, mobile tyre van for sale, tyre van city, mobile tyre business, van conversion UK"
        structuredData={[orgSchema, homeFaqStructuredData]}
      />
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <UKManufacturing />
        <ProcessSteps />
        <EarningsPotential />
        <TrainingSection />
        <FeaturedStock />
        <GalleryPreview />
        <VanDesigns />
        <DeliveryAreasSection />
        <Testimonials />
        <YouTubeSection />
        <FAQ />
        <HomeEnquiryForm />
        <CTASection />
        <PreFooterCTA />
      </main>
      <Footer />
    </div>
  );
}
