import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfiguratorProvider } from "@/lib/ConfiguratorContext";
import Home from "@/pages/Home";
import Stock from "@/pages/Stock";
import VanDetails from "@/pages/VanDetails";
import Configurator from "@/pages/Configurator";
import SelectVan from "@/pages/configurator/SelectVan";
import SelectKit from "@/pages/configurator/SelectKit";
import SelectFinance from "@/pages/configurator/SelectFinance";
import RequestQuote from "@/pages/configurator/RequestQuote";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminVans from "@/pages/admin/Vans";
import AdminKits from "@/pages/admin/Kits";
import AdminUpgrades from "@/pages/admin/Upgrades";
import AdminQuotes from "@/pages/admin/Quotes";
import AdminLeads from "@/pages/admin/Leads";
import AdminFinancePlans from "@/pages/admin/FinancePlans";
import BuildSheet from "@/pages/admin/BuildSheet";
import Portal from "@/pages/Portal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/stock" component={Stock} />
      <Route path="/stock/:slug" component={VanDetails} />
      <Route path="/configurator" component={Configurator} />
      {/* Conversion funnel routes */}
      <Route path="/configurator/van" component={SelectVan} />
      <Route path="/configurator/kit" component={SelectKit} />
      <Route path="/configurator/finance" component={SelectFinance} />
      <Route path="/configurator/quote" component={RequestQuote} />
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      {/* Customer portal routes */}
      <Route path="/portal" component={Portal} />
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/vans" component={AdminVans} />
      <Route path="/admin/kits" component={AdminKits} />
      <Route path="/admin/upgrades" component={AdminUpgrades} />
      <Route path="/admin/finance-plans" component={AdminFinancePlans} />
      <Route path="/admin/quotes" component={AdminQuotes} />
      <Route path="/admin/quotes/:id/build-sheet" component={BuildSheet} />
      <Route path="/admin/leads" component={AdminLeads} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfiguratorProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ConfiguratorProvider>
    </QueryClientProvider>
  );
}

export default App;
