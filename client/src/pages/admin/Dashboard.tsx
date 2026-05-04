import { useAuth } from "@/hooks/useAuth";
import type { User, Quote, Testimonial } from "@shared/schema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { 
  Car, 
  Package, 
  Wrench, 
  FileText, 
  Users, 
  Shield,
  Globe,
  Settings,
  Calculator,
  GraduationCap,
  BarChart3,
  Image,
  Video,
  UserRound,
  Layers,
  TrendingUp,
  CheckCircle2,
  PoundSterling,
  LayoutDashboard,
  Star as QuoteIcon,
  ExternalLink,
  Mail,
} from "lucide-react";

const COMMITTED_STATUSES = new Set(["deposit_taken", "finance_approved", "in_build"]);
const COMMITTED_LABEL: Record<string, string> = {
  deposit_taken: "Deposit Taken",
  finance_approved: "Finance Approved",
  in_build: "In Build",
};
const COMMITTED_BADGE: Record<string, string> = {
  deposit_taken: "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300",
  finance_approved: "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300",
  in_build: "bg-red-600 text-white",
};

function fmtGBP(pence: number) {
  return "£" + (pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function customerName(q: Quote): string {
  return [q.firstName, q.lastName].filter(Boolean).join(" ") || q.email || "Unknown";
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [activeTab, setActiveTab] = useState<"overview" | "pipeline">("overview");

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
    enabled: !!(user?.adminRole && user.adminRole === "full"),
  });

  const publishedTestimonialsCount = testimonials.filter(t => t.published).length;

  const committedQuotes = quotes.filter(q => COMMITTED_STATUSES.has(q.status));
  const committedTotal = committedQuotes.reduce((sum, q) => sum + (q.estTotal ?? 0), 0);

  const completedQuotes = quotes.filter(q => q.status === "completed");
  const completedTotal = completedQuotes.reduce((sum, q) => sum + (q.estTotal ?? 0), 0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (user && (!user.adminRole || user.adminRole === "none")) {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/"; }, 1000);
    }
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.adminRole || user.adminRole === "none") return null;

  const allManagementItems = [
    { title: "Analytics Dashboard", description: "Track site performance and customer activity", icon: BarChart3, href: "/admin/analytics", badge: "Analytics", requiredRole: "basic" as const },
    { title: "Manage Vans", description: "Add, edit, and manage van inventory", icon: Car, href: "/admin/vans", badge: "Inventory", requiredRole: "basic" as const },
    { title: "Manage Packs", description: "Configure equipment packages and pricing", icon: Package, href: "/admin/kits", badge: "Products", requiredRole: "full" as const },
    { title: "Manage Upgrades", description: "Add and organize upgrade options", icon: Wrench, href: "/admin/upgrades", badge: "Options", requiredRole: "full" as const },
    { title: "Manage Finance Plans", description: "Configure financing options for customers", icon: Calculator, href: "/admin/finance-plans", badge: "Finance", requiredRole: "full" as const },
    { title: "Manage Training Options", description: "Configure training programmes for configurator", icon: GraduationCap, href: "/admin/training-options", badge: "Training", requiredRole: "full" as const },
    { title: "Manage Gallery Items", description: "Upload and manage gallery images and videos", icon: Image, href: "/admin/gallery-items", badge: "Content", requiredRole: "full" as const },
    { title: "Manage Blog", description: "Write and publish blog posts and articles", icon: Globe, href: "/admin/blog", badge: "Blog", requiredRole: "full" as const },
    { title: "Manage Site Videos", description: "Upload hero video and 360° render videos — changes go live instantly", icon: Video, href: "/admin/videos", badge: "Videos", requiredRole: "full" as const },
    { title: "AI Packages", description: "Configure Bronze, Silver and Gold package tiers for the AI assistant to recommend", icon: Layers, href: "/admin/ai-packages", badge: "AI", requiredRole: "full" as const },
    { title: "Manage Testimonials", description: "Add, edit, and manage customer testimonials on the homepage", icon: QuoteIcon, href: "/admin/testimonials", badge: "Content", requiredRole: "basic" as const },
    { title: "Manage Users", description: "Assign roles and manage admin access", icon: Shield, href: "/admin/users", badge: "Security", requiredRole: "full" as const },
    { title: "Email Preview", description: "Send branded preview emails to any address so the team can sign off the design", icon: Mail, href: "/admin/email-preview", badge: "Email", requiredRole: "full" as const },
  ];

  const salesToolItems = [
    { title: "Admin Configurator", description: "Build a spec live on a call — compare vans, add kit and upgrades, calculate monthly payments in real time, then save as a quote", icon: UserRound, href: "/admin/configurator", badge: "Sales Tool", requiredRole: "basic" as const },
    { title: "Finance Calculator", description: "Quick standalone finance calculator — enter price, deposit and term to get instant monthly and weekly repayment figures", icon: Calculator, href: "/admin/finance-calculator", badge: "Sales Tool", requiredRole: "basic" as const },
  ];

  const allLeadsItems = [
    { title: "Configurators", description: "Review and manage all customer quote requests", icon: FileText, href: "/admin/quotes", badge: "Sales", requiredRole: "basic" as const },
    { title: "Leads", description: "Manage customer inquiries and contact form submissions", icon: Users, href: "/admin/leads", badge: "CRM", requiredRole: "basic" as const },
  ];

  const managementItems = allManagementItems.filter(item => {
    if (!user?.adminRole) return false;
    if (user.adminRole === "full") return true;
    return item.requiredRole === "basic";
  });

  const leadsItems = allLeadsItems.filter(item => {
    if (!user?.adminRole) return false;
    if (user.adminRole === "full") return true;
    return item.requiredRole === "basic";
  });

  return (
    <div className="min-h-full">
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.firstName || user?.email}`}
        actions={
          <div className="flex gap-1">
            <Button
              variant={activeTab === "overview" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("overview")}
              data-testid="button-tab-overview"
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              Overview
            </Button>
            <Button
              variant={activeTab === "pipeline" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("pipeline")}
              data-testid="button-tab-pipeline"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Pipeline
              {committedQuotes.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 no-default-active-elevate">{committedQuotes.length}</Badge>
              )}
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6 space-y-8">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-10">

            {/* Sales Tools */}
            {user?.adminRole && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-accent" />
                  Sales Tools
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {salesToolItems.map(item => (
                    <Card key={item.href} className="hover-elevate cursor-pointer transition-all">
                      <Link href={item.href} className="block h-full" data-testid={`link-admin-${item.href.split('/').pop()}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center space-x-2">
                              <item.icon className="w-5 h-5 text-accent" />
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                            </div>
                            <Badge variant="outline">{item.badge}</Badge>
                          </div>
                          <CardDescription>{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>Click to open →</span>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Leads & CRM */}
            {leadsItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Leads
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {leadsItems.map((item) => (
                    <Card key={item.href} className="hover-elevate cursor-pointer transition-all">
                      <Link href={item.href} className="block h-full" data-testid={`link-admin-${item.href.split('/').pop()}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center space-x-2">
                              <item.icon className="w-5 h-5 text-accent" />
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                            </div>
                            <Badge variant="outline">{item.badge}</Badge>
                          </div>
                          <CardDescription>{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>Click to open →</span>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Site Management */}
            {managementItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent" />
                  Site Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {managementItems.map((item) => (
                    <Card key={item.href} className="hover-elevate cursor-pointer transition-all">
                      <Link href={item.href} className="block h-full" data-testid={`link-admin-${item.href.split('/').pop()}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center space-x-2">
                              <item.icon className="w-5 h-5 text-accent" />
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                            </div>
                            <Badge variant="outline">{item.badge}</Badge>
                          </div>
                          <CardDescription>{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>Click to manage →</span>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Use this admin panel to manage your mobile tyre van business content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Content Management</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Add and edit van inventory</li>
                      <li>• Configure equipment packages</li>
                      <li>• Manage upgrade options and pricing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Customer Data</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Review customer quotes</li>
                      <li>• Manage leads and inquiries</li>
                      <li>• Track sales and conversions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── PIPELINE & JOBS TAB ── */}
        {activeTab === "pipeline" && (
          <div className="space-y-10">

            {/* Committed Pipeline */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Committed Pipeline
                {committedQuotes.length > 0 && (
                  <Badge variant="outline" className="ml-1">{committedQuotes.length} job{committedQuotes.length !== 1 ? "s" : ""}</Badge>
                )}
              </h2>

              {committedQuotes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No committed jobs at the moment.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardDescription>Jobs with deposit taken, finance approved, or in build</CardDescription>
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <PoundSterling className="w-4 h-4 text-accent" />
                        <span>Pipeline value: <span className="text-accent">{fmtGBP(committedTotal)}</span></span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {committedQuotes.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-center gap-3 px-4 py-3"
                          data-testid={`row-pipeline-quote-${q.id}`}
                        >
                          <span className={`shrink-0 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${COMMITTED_BADGE[q.status] ?? "bg-muted text-muted-foreground"}`}>
                            {COMMITTED_LABEL[q.status] ?? q.status}
                          </span>
                          <Link
                            href={`/admin/quotes/${q.id}?from=quotes`}
                            className="flex-1 min-w-0 hover:underline underline-offset-2 cursor-pointer"
                            data-testid={`link-pipeline-quote-${q.id}`}
                          >
                            <p className="text-sm font-medium truncate">{customerName(q)}</p>
                            {q.vanTitle && (
                              <p className="text-xs text-muted-foreground truncate">{q.vanTitle}</p>
                            )}
                          </Link>
                          {q.estTotal != null && q.estTotal > 0 && (
                            <span className="shrink-0 text-sm font-semibold tabular-nums">
                              {fmtGBP(q.estTotal)}
                            </span>
                          )}
                          <Link
                            href={`/admin/quotes/${q.id}?tab=configuration&from=quotes`}
                            className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover-elevate"
                            data-testid={`link-pipeline-edit-config-${q.id}`}
                            title="Edit configuration"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Edit Config
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Completed Jobs */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                Completed Jobs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="rounded-md bg-accent/10 p-2.5">
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Completed</p>
                      <p className="text-2xl font-bold" data-testid="text-completed-count">{completedQuotes.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="rounded-md bg-accent/10 p-2.5">
                      <PoundSterling className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold text-accent" data-testid="text-completed-total">{fmtGBP(completedTotal)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
