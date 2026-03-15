import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfiguratorProvider } from "@/lib/ConfiguratorContext";
import ScrollRestoration from "@/components/ScrollRestoration";
import LoadingScreen from "@/components/LoadingScreen";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import ChatBubble from "@/components/ChatBubble";
import { useState, useEffect } from "react";
import { initializeBucketName, hasGivenConsent } from "@/lib/utils";
import Home from "@/pages/Home";
import Stock from "@/pages/Stock";
import VanDetails from "@/pages/VanDetails";
import Finance from "@/pages/Finance";
import Gallery from "@/pages/Gallery";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import HowItWorks from "@/pages/HowItWorks";
import Training from "@/pages/Training";
import BusinessOpportunity from "@/pages/BusinessOpportunity";
import SelectVan from "@/pages/configurator/SelectVan";
import SelectServiceType from "@/pages/configurator/SelectServiceType";
import SelectKit from "@/pages/configurator/SelectKit";
import SelectUpgrades from "@/pages/configurator/SelectUpgrades";
import SelectTraining from "@/pages/configurator/SelectTraining";
import SelectFinance from "@/pages/configurator/SelectFinance";
import RequestQuote from "@/pages/configurator/RequestQuote";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminVans from "@/pages/admin/Vans";
import AdminKits from "@/pages/admin/Kits";
import AdminUpgrades from "@/pages/admin/Upgrades";
import AdminQuotes from "@/pages/admin/Quotes";
import AdminQuoteDetail from "@/pages/admin/QuoteDetail";
import AdminLeads from "@/pages/admin/Leads";
import AdminUsers from "@/pages/admin/Users";
import AdminFinancePlans from "@/pages/admin/FinancePlans";
import AdminTrainingOptions from "@/pages/admin/TrainingOptions";
import AdminGalleryItems from "@/pages/admin/GalleryItems";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminVideos from "@/pages/admin/Videos";
import BuildSheet from "@/pages/admin/BuildSheet";
import QuoteConfirmation from "@/pages/QuoteConfirmation";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import CookiePolicy from "@/pages/CookiePolicy";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/stock" component={Stock} />
      <Route path="/stock/:slug" component={VanDetails} />
      <Route path="/finance" component={Finance} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/training" component={Training} />
      <Route path="/business-opportunity" component={BusinessOpportunity} />
      {/* Configurator - redirect to multi-step flow */}
      <Route path="/configurator">
        {() => {
          window.location.href = '/configurator/van';
          return null;
        }}
      </Route>
      {/* Conversion funnel routes */}
      <Route path="/configurator/van" component={SelectVan} />
      <Route path="/configurator/service-type" component={SelectServiceType} />
      <Route path="/configurator/kit" component={SelectKit} />
      <Route path="/configurator/upgrades" component={SelectUpgrades} />
      <Route path="/configurator/training" component={SelectTraining} />
      <Route path="/configurator/finance" component={SelectFinance} />
      <Route path="/configurator/quote" component={RequestQuote} />
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      {/* Quote confirmation (public) */}
      <Route path="/quote/confirm/:token" component={QuoteConfirmation} />
      {/* Legal pages */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsConditions} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/vans" component={AdminVans} />
      <Route path="/admin/kits" component={AdminKits} />
      <Route path="/admin/upgrades" component={AdminUpgrades} />
      <Route path="/admin/finance-plans" component={AdminFinancePlans} />
      <Route path="/admin/training-options" component={AdminTrainingOptions} />
      <Route path="/admin/gallery-items" component={AdminGalleryItems} />
      <Route path="/admin/videos" component={AdminVideos} />
      <Route path="/admin/quotes" component={AdminQuotes} />
      <Route path="/admin/quotes/:id" component={AdminQuoteDetail} />
      <Route path="/admin/quotes/:id/build-sheet" component={BuildSheet} />
      <Route path="/admin/leads" component={AdminLeads} />
      <Route path="/admin/users" component={AdminUsers} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicChatBubble() {
  const [location] = useLocation();
  if (location.startsWith("/admin") || location === "/login") return null;
  return <ChatBubble />;
}

function App() {
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  // Initialize bucket name for image URLs on app startup
  useEffect(() => {
    initializeBucketName();
  }, []);

  // Check if user has given cookie consent
  useEffect(() => {
    setShowCookieBanner(!hasGivenConsent());
  }, []);

  const handleConsent = () => {
    setShowCookieBanner(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ConfiguratorProvider>
        <TooltipProvider>
          <LoadingScreen />
          <ScrollRestoration />
          <Toaster />
          <AnalyticsProvider>
            <Router />
          </AnalyticsProvider>
          <PublicChatBubble />
          {showCookieBanner && <CookieConsentBanner onConsent={handleConsent} />}
        </TooltipProvider>
      </ConfiguratorProvider>
    </QueryClientProvider>
  );
}

export default App;
