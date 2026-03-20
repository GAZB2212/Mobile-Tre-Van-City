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
import { useState, useEffect, lazy, Suspense } from "react";
import { initializeBucketName, hasGivenConsent } from "@/lib/utils";
import AppErrorBoundary from "@/components/AppErrorBoundary";

const Home = lazy(() => import("@/pages/Home"));
const Stock = lazy(() => import("@/pages/Stock"));
const VanDetails = lazy(() => import("@/pages/VanDetails"));
const Finance = lazy(() => import("@/pages/Finance"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const Training = lazy(() => import("@/pages/Training"));
const BusinessOpportunity = lazy(() => import("@/pages/BusinessOpportunity"));
const SelectVan = lazy(() => import("@/pages/configurator/SelectVan"));
const SelectServiceType = lazy(() => import("@/pages/configurator/SelectServiceType"));
const SelectKit = lazy(() => import("@/pages/configurator/SelectKit"));
const SelectUpgrades = lazy(() => import("@/pages/configurator/SelectUpgrades"));
const SelectTraining = lazy(() => import("@/pages/configurator/SelectTraining"));
const SelectFinance = lazy(() => import("@/pages/configurator/SelectFinance"));
const RequestQuote = lazy(() => import("@/pages/configurator/RequestQuote"));
const Login = lazy(() => import("@/pages/Login"));
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
const QuoteConfirmation = lazy(() => import("@/pages/QuoteConfirmation"));
const SpecApproval = lazy(() => import("@/pages/SpecApproval"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const AdminBlog = lazy(() => import("@/pages/admin/Blog"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("@/pages/TermsConditions"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
      {/* Spec approval (public) */}
      <Route path="/spec-approval/:token" component={SpecApproval} />
      {/* Blog */}
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      {/* Legal pages */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsConditions} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      {/* Admin routes */}
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
      <Route path="/admin/leads" component={AdminLeads} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/blog" component={AdminBlog} />
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

function ConditionalLoadingScreen() {
  const [location] = useLocation();
  // Skip splash screen for pages that customers land on directly from email links.
  // Also mark the session as loaded so navigating away doesn't trigger the splash.
  if (location.startsWith("/spec-approval/") || location.startsWith("/quote/confirm/")) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hasLoadedBefore", "true");
    }
    return null;
  }
  return <LoadingScreen />;
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
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfiguratorProvider>
          <TooltipProvider>
            <ConditionalLoadingScreen />
            <ScrollRestoration />
            <Toaster />
            <AnalyticsProvider>
              <Suspense fallback={<div className="min-h-screen bg-[#191919]" />}>
                <Router />
              </Suspense>
            </AnalyticsProvider>
            <PublicChatBubble />
            {showCookieBanner && <CookieConsentBanner onConsent={handleConsent} />}
          </TooltipProvider>
        </ConfiguratorProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
