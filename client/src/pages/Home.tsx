import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UKManufacturing from "@/components/UKManufacturing";
import ProcessSteps from "@/components/ProcessSteps";
import EarningsPotential from "@/components/EarningsPotential";
import TrainingSection from "@/components/TrainingSection";
import TrustStrip from "@/components/TrustStrip";
import FeaturedStock from "@/components/FeaturedStock";
import PreviouslyBuiltVans from "@/components/PreviouslyBuiltVans";
import VanDesigns from "@/components/VanDesigns";
import Testimonials from "@/components/Testimonials";
import YouTubeSection from "@/components/YouTubeSection";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import SEO, { organizationStructuredData } from "@/components/SEO";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Custom-Built Mobile Tyre Vans UK | Nationwide Delivery"
        description="Build your dream mobile tyre business with a custom-built van from Tyre Van City. We offer nationwide delivery, flexible finance, and complete, ready-to-earn conversion packages."
        canonical="/"
        structuredData={organizationStructuredData}
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
        <PreviouslyBuiltVans />
        <VanDesigns />
        <Testimonials />
        <YouTubeSection />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}