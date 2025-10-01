import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UKManufacturing from "@/components/UKManufacturing";
import ProcessSteps from "@/components/ProcessSteps";
import TrustStrip from "@/components/TrustStrip";
import FeaturedStock from "@/components/FeaturedStock";
import WirralVansInventory from "@/components/WirralVansInventory";
import PreviouslyBuiltVans from "@/components/PreviouslyBuiltVans";
import VanDesigns from "@/components/VanDesigns";
import Testimonials from "@/components/Testimonials";
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
        <FeaturedStock />
        <WirralVansInventory />
        <PreviouslyBuiltVans />
        <VanDesigns />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}