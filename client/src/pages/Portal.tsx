import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  DollarSign,
  Wrench,
  Eye,
  ArrowLeft
} from "lucide-react";
import type { Quote } from "@shared/schema";

export default function Portal() {
  const { user, isAuthenticated } = useAuth();

  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ['/api/portal/quotes'],
    enabled: isAuthenticated,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { label: "Pending Review", variant: "secondary", icon: Clock },
      approved: { label: "Approved", variant: "default", icon: CheckCircle },
      in_progress: { label: "In Progress", variant: "outline", icon: Wrench },
      completed: { label: "Completed", variant: "default", icon: CheckCircle },
      cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getFinanceStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "secondary" },
      approved: { label: "Approved", variant: "default" },
      declined: { label: "Declined", variant: "destructive" },
      more_info_needed: { label: "More Info Required", variant: "outline" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant={config.variant} data-testid={`badge-finance-${status}`}>
        {config.label}
      </Badge>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              Please login to access your portal.
            </p>
            <Button asChild variant="default">
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild 
            className="mb-4"
            data-testid="button-back-to-website"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-portal-title">
            My Portal
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your configurations, build progress, and finance applications
          </p>
        </div>

        <div className="grid gap-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {user?.firstName || user?.username}!</CardTitle>
              <CardDescription>
                Here you can view all your submitted configurations and track their progress
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Configurations List */}
          {quotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Configurations Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your perfect mobile tyre van setup
                </p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground" data-testid="button-configure-new">
                  <Link href="/configurator">Configure Your Van</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">My Configurations</h2>
              {quotes.map((quote) => (
                <Card key={quote.id} className="hover-elevate" data-testid={`card-quote-${quote.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          Quote #{quote.id.slice(0, 8).toUpperCase()}
                          {getStatusBadge(quote.status || "pending")}
                        </CardTitle>
                        <CardDescription>
                          {quote.createdAt 
                            ? `Submitted ${new Date(quote.createdAt).toLocaleDateString()}`
                            : "Submitted recently"
                          }
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" data-testid={`text-total-${quote.id}`}>
                          £{((quote.estTotal || 0) / 100).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Inc. VAT</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">Finance Status</div>
                          <div className="mt-1">
                            {getFinanceStatusBadge(quote.financeStatus || "pending")}
                          </div>
                        </div>
                      </div>

                      {quote.buildStage && (
                        <div className="flex items-start gap-3">
                          <Wrench className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-sm font-medium">Build Stage</div>
                            <div className="mt-1 text-sm text-muted-foreground capitalize">
                              {quote.buildStage.replace(/_/g, " ")}
                            </div>
                          </div>
                        </div>
                      )}

                      {quote.company && (
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-sm font-medium">Company</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {quote.company}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex gap-3">
                      <Button 
                        asChild 
                        variant="default" 
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                        data-testid={`button-view-${quote.id}`}
                      >
                        <Link href={`/portal/configuration/${quote.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
