import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UKManufacturing from "@/components/UKManufacturing";
import ProcessSteps from "@/components/ProcessSteps";
import EarningsPotential from "@/components/EarningsPotential";
import TrustStrip from "@/components/TrustStrip";
import FeaturedStock from "@/components/FeaturedStock";
import PreviouslyBuiltVans from "@/components/PreviouslyBuiltVans";
import VanDesigns from "@/components/VanDesigns";
import Testimonials from "@/components/Testimonials";
import YouTubeSection from "@/components/YouTubeSection";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <UKManufacturing />
        <ProcessSteps />
        <EarningsPotential />
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