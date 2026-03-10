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
import SEO, { organizationStructuredData, homeFaqStructuredData } from "@/components/SEO";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Mobile Tyre Van Conversions UK | Custom-Built & Ready to Earn"
        description="UK's leading mobile tyre van conversion specialists. Custom-built mobile tyre vans, fully equipped with professional tyre fitting equipment. Nationwide delivery. Finance available. Call 0151 203 8500."
        canonical="/"
        keywords="mobile tyre van, tyre van conversion, mobile tyre fitting van, mobile tyre van for sale, tyre van city, mobile tyre business, van conversion UK"
        structuredData={[organizationStructuredData, homeFaqStructuredData]}
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
        <Testimonials />
        <YouTubeSection />
        <FAQ />
        <HomeEnquiryForm />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}