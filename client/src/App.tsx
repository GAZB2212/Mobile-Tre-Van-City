import { Switch, Route, useLocation, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfiguratorProvider } from "@/lib/ConfiguratorContext";
import ScrollRestoration from "@/components/ScrollRestoration";
import LoadingScreen from "@/components/LoadingScreen";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import ChatBubble from "@/components/ChatBubble";
import AIChatWidget from "@/components/AIChatWidget";
import ConfiguratorIdleModal from "@/components/ConfiguratorIdleModal";
import { useState, useEffect, lazy, Suspense } from "react";
import { initializeBucketName, hasGivenConsent } from "@/lib/utils";
import AppErrorBoundary from "@/components/AppErrorBoundary";
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
import AIReview from "@/pages/configurator/AIReview";
import Login from "@/pages/Login";
import QuoteConfirmation from "@/pages/QuoteConfirmation";
import SpecApproval from "@/pages/SpecApproval";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import CookiePolicy from "@/pages/CookiePolicy";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/not-found";
import VanConversionsHub from "@/pages/seo/VanConversionsHub";
import VanModelPage from "@/pages/seo/VanModelPage";
import LocationsHub from "@/pages/seo/LocationsHub";
import LocationPage from "@/pages/seo/LocationPage";

// Admin pages are SSR-bypassed, so lazy-load them to keep the public bundle small
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminConfigurator = lazy(() => import("@/pages/admin/AdminConfigurator"));
const AdminVans = lazy(() => import("@/pages/admin/Vans"));
const AdminKits = lazy(() => import("@/pages/admin/Kits"));
const AdminUpgrades = lazy(() => import("@/pages/admin/Upgrades"));
const AdminQuotes = lazy(() => import("@/pages/admin/Quotes"));
const AdminQuoteDetail = lazy(() => import("@/pages/admin/QuoteDetail"));
const AdminLeads = lazy(() => import("@/pages/admin/Leads"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminFinancePlans = lazy(() => import("@/pages/admin/FinancePlans"));
const AdminTrainingOptions = lazy(() => import("@/pages/admin/TrainingOptions"));
const AdminGalleryItems = lazy(() => import("@/pages/admin/GalleryItems"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminVideos = lazy(() => import("@/pages/admin/Videos"));
const BuildSheet = lazy(() => import("@/pages/admin/BuildSheet"));
const BuildProgress = lazy(() => import("@/pages/admin/BuildProgress"));
const AdminBlog = lazy(() => import("@/pages/admin/Blog"));
const AdminAIPackages = lazy(() => import("@/pages/admin/AIPackages"));

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
      <Route path="/configurator">
        <Redirect to="/configurator/van" />
      </Route>
      <Route path="/configurator/van" component={SelectVan} />
      <Route path="/configurator/service-type" component={SelectServiceType} />
      <Route path="/configurator/kit" component={SelectKit} />
      <Route path="/configurator/upgrades" component={SelectUpgrades} />
      <Route path="/configurator/training" component={SelectTraining} />
      <Route path="/configurator/finance" component={SelectFinance} />
      <Route path="/configurator/ai-review" component={AIReview} />
      <Route path="/configurator/quote" component={RequestQuote} />
      <Route path="/login" component={Login} />
      <Route path="/quote/confirm/:token" component={QuoteConfirmation} />
      <Route path="/spec-approval/:token" component={SpecApproval} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsConditions} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/van-conversions" component={VanConversionsHub} />
      <Route path="/van-conversions/:slug" component={VanModelPage} />
      <Route path="/mobile-tyre-vans" component={LocationsHub} />
      <Route path="/mobile-tyre-vans/:slug" component={LocationPage} />
      {/* Admin routes — bypassed by SSR, loaded lazily */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/configurator" component={AdminConfigurator} />
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
      <Route path="/admin/quotes/:id/build-progress" component={BuildProgress} />
      <Route path="/admin/leads" component={AdminLeads} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/admin/ai-packages" component={AdminAIPackages} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicChatBubble() {
  const [location] = useLocation();
  if (location.startsWith("/admin") || location === "/login") return null;
  return <ChatBubble />;
}

function AIWidget() {
  const [location] = useLocation();
  if (location.startsWith("/admin") || location === "/login") return null;
  return <AIChatWidget />;
}

function ConditionalLoadingScreen() {
  const [location] = useLocation();
  if (location.startsWith("/spec-approval/") || location.startsWith("/quote/confirm/") || location.includes("/build-progress")) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hasLoadedBefore", "true");
    }
    return null;
  }
  return <LoadingScreen />;
}

function App() {
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    initializeBucketName();
  }, []);

  useEffect(() => {
    setShowCookieBanner(!hasGivenConsent());
  }, []);

  const handleConsent = () => {
    setShowCookieBanner(false);
  };

  return (
    <AppErrorBoundary>
      <ConfiguratorProvider>
        <TooltipProvider>
          <ConditionalLoadingScreen />
          <ScrollRestoration />
          <Toaster />
          <AnalyticsProvider>
            <Suspense fallback={null}>
              <Router />
            </Suspense>
          </AnalyticsProvider>
          <PublicChatBubble />
          <AIWidget />
          <ConfiguratorIdleModal />
          {showCookieBanner && <CookieConsentBanner onConsent={handleConsent} />}
        </TooltipProvider>
      </ConfiguratorProvider>
    </AppErrorBoundary>
  );
}

export default App;
