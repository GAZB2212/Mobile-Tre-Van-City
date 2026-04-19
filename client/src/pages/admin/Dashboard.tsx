import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { 
  Car, 
  Package, 
  Wrench, 
  FileText, 
  Users, 
  Shield,
  Globe,
  Settings,
  LogOut,
  Calculator,
  GraduationCap,
  BarChart3,
  Image,
  RefreshCw,
  Video,
  UserRound,
  Layers
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [syncing, setSyncing] = useState(false);
  const [syncConfirm, setSyncConfirm] = useState(false);

  const handleCatalogSync = async () => {
    if (!syncConfirm) {
      setSyncConfirm(true);
      return;
    }
    setSyncing(true);
    setSyncConfirm(false);
    try {
      const result = await apiRequest("POST", "/api/admin/sync-catalog");
      const data = await result.json();
      toast({
        title: "Catalog Synced",
        description: `Synced: ${data.counts?.vans} vans, ${data.counts?.kits} kits, ${data.counts?.upgrades} upgrades, ${data.counts?.training_options} training options`,
      });
    } catch (err) {
      toast({ title: "Sync Failed", description: String(err), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check if user has admin role (basic or full)
  useEffect(() => {
    if (user && (!user.adminRole || user.adminRole === "none")) {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
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

  if (!isAuthenticated || !user?.adminRole || user.adminRole === "none") {
    return null;
  }

  const allManagementItems = [
    {
      title: "Analytics Dashboard",
      description: "Track site performance and customer activity",
      icon: BarChart3,
      href: "/admin/analytics",
      badge: "Analytics",
      requiredRole: "basic" as const
    },
    {
      title: "Manage Vans",
      description: "Add, edit, and manage van inventory",
      icon: Car,
      href: "/admin/vans",
      badge: "Inventory",
      requiredRole: "full" as const
    },
    {
      title: "Manage Packs",
      description: "Configure equipment packages and pricing",
      icon: Package,
      href: "/admin/kits",
      badge: "Products",
      requiredRole: "full" as const
    },
    {
      title: "Manage Upgrades",
      description: "Add and organize upgrade options",
      icon: Wrench,
      href: "/admin/upgrades",
      badge: "Options",
      requiredRole: "full" as const
    },
    {
      title: "Manage Finance Plans",
      description: "Configure financing options for customers",
      icon: Calculator,
      href: "/admin/finance-plans",
      badge: "Finance",
      requiredRole: "full" as const
    },
    {
      title: "Manage Training Options",
      description: "Configure training programmes for configurator",
      icon: GraduationCap,
      href: "/admin/training-options",
      badge: "Training",
      requiredRole: "full" as const
    },
    {
      title: "Manage Gallery Items",
      description: "Upload and manage gallery images and videos",
      icon: Image,
      href: "/admin/gallery-items",
      badge: "Content",
      requiredRole: "full" as const
    },
    {
      title: "Manage Blog",
      description: "Write and publish blog posts and articles",
      icon: Globe,
      href: "/admin/blog",
      badge: "Blog",
      requiredRole: "full" as const
    },
    {
      title: "Manage Site Videos",
      description: "Upload hero video and 360° render videos — changes go live instantly",
      icon: Video,
      href: "/admin/videos",
      badge: "Videos",
      requiredRole: "full" as const
    },
    {
      title: "AI Packages",
      description: "Configure Bronze, Silver and Gold package tiers for the AI assistant to recommend",
      icon: Layers,
      href: "/admin/ai-packages",
      badge: "AI",
      requiredRole: "full" as const
    },
    {
      title: "Manage Users",
      description: "Assign roles and manage admin access",
      icon: Shield,
      href: "/admin/users",
      badge: "Security",
      requiredRole: "full" as const
    }
  ];

  const salesToolItems = [
    {
      title: "Admin Configurator",
      description: "Build a spec live on a call — compare vans, add kit and upgrades, calculate monthly payments in real time, then save as a quote",
      icon: UserRound,
      href: "/admin/configurator",
      badge: "Sales Tool",
      requiredRole: "basic" as const
    },
    {
      title: "Finance Calculator",
      description: "Quick standalone finance calculator — enter price, deposit and term to get instant monthly and weekly repayment figures",
      icon: Calculator,
      href: "/admin/finance-calculator",
      badge: "Sales Tool",
      requiredRole: "basic" as const
    },
  ];

  const allLeadsItems = [
    {
      title: "Configurators",
      description: "Review and manage all customer quote requests",
      icon: FileText,
      href: "/admin/quotes",
      badge: "Sales",
      requiredRole: "basic" as const
    },
    {
      title: "Leads",
      description: "Manage customer inquiries and contact form submissions",
      icon: Users,
      href: "/admin/leads",
      badge: "CRM",
      requiredRole: "basic" as const
    },
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
      <div className="container mx-auto px-4 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {user?.firstName || user?.email}
          </p>
        </div>
        {/* Sales Tools Section */}
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

        {/* Leads & CRM Section */}
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

        {/* Site Management Section */}
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

        {user?.adminRole === "full" && (
          <Card className="mt-6 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-accent" />
                <CardTitle>Sync Catalog Data</CardTitle>
              </div>
              <CardDescription>
                Replace this database's vans, kits, upgrades and training options with the latest dev version. Quotes and leads are preserved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncConfirm ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-muted-foreground">This will replace all catalog data. Are you sure?</p>
                  <Button variant="destructive" size="sm" onClick={handleCatalogSync} disabled={syncing} data-testid="button-sync-confirm">
                    {syncing ? "Syncing..." : "Yes, Sync Now"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSyncConfirm(false)} data-testid="button-sync-cancel">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleCatalogSync} disabled={syncing} data-testid="button-sync-catalog">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync from Dev
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}