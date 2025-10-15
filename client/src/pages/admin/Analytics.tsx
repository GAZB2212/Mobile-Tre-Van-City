import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Car, 
  Package,
  ArrowLeft,
  Activity,
  Calendar
} from "lucide-react";
interface AnalyticsData {
  overview: {
    totalQuotes: number;
    totalLeads: number;
    totalVans: number;
    publishedVans: number;
    recentQuotes: number;
    recentLeads: number;
  };
  quotesByStatus: Record<string, number>;
  popularVans: Array<{
    vanId: string;
    title: string;
    count: number;
  }>;
  popularKits: Array<{
    kitId: string;
    count: number;
  }>;
  recentActivity: {
    quotes: Array<{
      id: string;
      customerName: string;
      customerEmail: string;
      status: string;
      totalPrice: number;
      createdAt: string;
    }>;
    leads: Array<{
      id: string;
      name: string;
      email: string;
      subject: string;
      createdAt: string;
    }>;
  };
}

export default function AdminAnalytics() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    enabled: !!user?.isAdmin,
  });

  const formatPrice = (pence: number): string => {
    return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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

  if (isLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild data-testid="button-back-dashboard">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Site Analytics</h1>
                <p className="text-muted-foreground">
                  Track your website performance and customer activity
                </p>
              </div>
            </div>
            <Badge variant="secondary">
              <Activity className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-quotes">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-quotes">
                {analytics?.overview.totalQuotes || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-primary font-medium">
                  {analytics?.overview.recentQuotes || 0}
                </span>{" "}
                in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-leads">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-leads">
                {analytics?.overview.totalLeads || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-primary font-medium">
                  {analytics?.overview.recentLeads || 0}
                </span>{" "}
                in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-vans">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Van Inventory</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-vans">
                {analytics?.overview.totalVans || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-primary font-medium">
                  {analytics?.overview.publishedVans || 0}
                </span>{" "}
                published
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-quote-status">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quote Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {analytics?.quotesByStatus && Object.entries(analytics.quotesByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{status}:</span>
                    <span className="font-medium" data-testid={`text-status-${status}`}>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Vans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card data-testid="card-popular-vans">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Most Popular Vans
              </CardTitle>
              <CardDescription>Top 5 vans selected in quotes</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.popularVans && analytics.popularVans.length > 0 ? (
                <div className="space-y-3">
                  {analytics.popularVans.map((van, index) => (
                    <div key={van.vanId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <span className="font-medium" data-testid={`text-popular-van-${index}`}>
                          {van.title}
                        </span>
                      </div>
                      <Badge data-testid={`badge-van-count-${index}`}>
                        {van.count} {van.count === 1 ? 'quote' : 'quotes'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available yet</p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-popular-kits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Most Popular Kits
              </CardTitle>
              <CardDescription>Top 5 kits selected in quotes</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.popularKits && analytics.popularKits.length > 0 ? (
                <div className="space-y-3">
                  {analytics.popularKits.map((kit, index) => (
                    <div key={kit.kitId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <span className="font-medium" data-testid={`text-popular-kit-${index}`}>
                          Kit ID: {kit.kitId}
                        </span>
                      </div>
                      <Badge data-testid={`badge-kit-count-${index}`}>
                        {kit.count} {kit.count === 1 ? 'quote' : 'quotes'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-recent-quotes">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recent Quotes
              </CardTitle>
              <CardDescription>Latest 5 quote requests</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentActivity.quotes && analytics.recentActivity.quotes.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentActivity.quotes.map((quote, index) => (
                    <div key={quote.id} className="border-b last:border-0 pb-3 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" data-testid={`text-quote-customer-${index}`}>
                            {quote.customerName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {quote.customerEmail}
                          </p>
                        </div>
                        <Badge variant="outline" data-testid={`badge-quote-status-${index}`}>
                          {quote.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium" data-testid={`text-quote-price-${index}`}>
                          {formatPrice(quote.totalPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No quotes yet</p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-recent-leads">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Recent Leads
              </CardTitle>
              <CardDescription>Latest 5 customer inquiries</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentActivity.leads && analytics.recentActivity.leads.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentActivity.leads.map((lead, index) => (
                    <div key={lead.id} className="border-b last:border-0 pb-3 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" data-testid={`text-lead-name-${index}`}>
                            {lead.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {lead.email}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate" data-testid={`text-lead-subject-${index}`}>
                        {lead.subject}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No leads yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
