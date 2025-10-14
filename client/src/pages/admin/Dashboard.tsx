import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  Package, 
  Wrench, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Calculator,
  Download,
  GraduationCap
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
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

  // Check if user is admin
  useEffect(() => {
    if (user && !user.isAdmin) {
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

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  const adminItems = [
    {
      title: "Manage Vans",
      description: "Add, edit, and manage van inventory",
      icon: Car,
      href: "/admin/vans",
      badge: "Inventory"
    },
    {
      title: "Wirral Vans Import",
      description: "Import vans from Wirral Vans site",
      icon: Download,
      href: "/admin/wirral-vans",
      badge: "Integration"
    },
    {
      title: "Manage Kits",
      description: "Configure equipment packages and pricing",
      icon: Package,
      href: "/admin/kits",
      badge: "Products"
    },
    {
      title: "Manage Upgrades",
      description: "Add and organize upgrade options",
      icon: Wrench,
      href: "/admin/upgrades",
      badge: "Options"
    },
    {
      title: "Manage Finance Plans",
      description: "Configure financing options for customers",
      icon: Calculator,
      href: "/admin/finance-plans",
      badge: "Finance"
    },
    {
      title: "Manage Training Options",
      description: "Configure training programmes for configurator",
      icon: GraduationCap,
      href: "/admin/training-options",
      badge: "Training"
    },
    {
      title: "View Quotes",
      description: "Review customer quotes and requests",
      icon: FileText,
      href: "/admin/quotes",
      badge: "Sales"
    },
    {
      title: "View Leads",
      description: "Manage customer inquiries and leads",
      icon: Users,
      href: "/admin/leads",
      badge: "CRM"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.firstName || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Admin</Badge>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" data-testid="link-main-site">
                  <Settings className="w-4 h-4 mr-2" />
                  Main Site
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/api/logout"} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminItems.map((item) => (
            <Card key={item.href} className="hover-elevate cursor-pointer transition-all">
              <Link href={item.href} className="block h-full" data-testid={`link-admin-${item.href.split('/').pop()}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <item.icon className="w-5 h-5 text-primary" />
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
    </div>
  );
}