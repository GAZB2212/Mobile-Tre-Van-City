import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer } from "lucide-react";
import type { Quote, Van, Kit, Upgrade, FinancePlan } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function BuildSheet() {
  const params = useParams();
  const quoteId = params.id;
  const [, setLocation] = useLocation();
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

  const { data: quotes = [], isLoading: isLoadingQuotes } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: !!user?.isAdmin,
  });

  const { data: vans = [] } = useQuery<Van[]>({
    queryKey: ["/api/admin/vans"],
    enabled: !!user?.isAdmin,
  });

  const { data: kits = [] } = useQuery<Kit[]>({
    queryKey: ["/api/admin/kits"],
    enabled: !!user?.isAdmin,
  });

  const { data: allUpgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
    enabled: !!user?.isAdmin,
  });

  const { data: financePlans = [] } = useQuery<FinancePlan[]>({
    queryKey: ["/api/admin/finance-plans"],
    enabled: !!user?.isAdmin,
  });

  const quote = quotes.find((q) => q.id === quoteId);
  const van = quote?.vanId ? vans.find((v) => v.id === quote.vanId) : undefined;
  const kit = kits.find((k) => k.id === quote?.kitId);
  const upgrades = allUpgrades.filter((u) => quote?.selectedUpgradeIds.includes(u.id));
  const financePlan = quote?.financePlanId ? financePlans.find((f) => f.id === quote.financePlanId) : undefined;

  const formatDate = (dateString: string | Date | null): string => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatBuildStage = (stage: string | null): string => {
    if (!stage) return "Not Started";
    return stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || isLoadingQuotes) {
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

  if (!isLoadingQuotes && !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Quote not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setLocation("/admin/quotes")}
            data-testid="button-back-to-quotes"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  // TypeScript guard: quote is guaranteed to be defined here
  if (!quote) return null;

  return (
    <>
      <div className="no-print bg-background border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin/quotes")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>
          <Button onClick={handlePrint} data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            Print Build Sheet
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl print:max-w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            Van Build Sheet
          </h1>
          <p className="text-muted-foreground">
            Quote Reference: {quote.id.substring(0, 8).toUpperCase()}
          </p>
          <p className="text-sm text-muted-foreground">
            Date: {formatDate(quote.createdAt)}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium" data-testid="text-customer-name">
                    {quote.userName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium" data-testid="text-customer-email">
                    {quote.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium" data-testid="text-customer-phone">
                    {quote.phone}
                  </p>
                </div>
                {quote.company && (
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium" data-testid="text-customer-company">
                      {quote.company}
                    </p>
                  </div>
                )}
              </div>
              {quote.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Customer Request Notes</p>
                  <p className="text-sm" data-testid="text-customer-notes">
                    {quote.notes}
                  </p>
                </div>
              )}
              {quote.adminNotes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground font-semibold">Admin Notes (Internal)</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-admin-notes">
                    {quote.adminNotes}
                  </p>
                </div>
              )}
              {quote.customerNotes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground font-semibold">Customer Notes</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-customer-facing-notes">
                    {quote.customerNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {van && (
            <Card>
              <CardHeader>
                <CardTitle>Base Vehicle Specification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold" data-testid="text-van-title">
                    {van.make} {van.model} ({van.year})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mileage</p>
                      <p className="font-medium" data-testid="text-van-mileage">
                        {van.mileage.toLocaleString()} miles
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transmission</p>
                      <p className="font-medium" data-testid="text-van-transmission">
                        {van.specs.transmission}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fuel Type</p>
                      <p className="font-medium" data-testid="text-van-fuel">
                        {van.specs.fuel}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Size/Body Type</p>
                      <p className="font-medium" data-testid="text-van-size">
                        {van.specs.size}
                      </p>
                    </div>
                    {van.specs.engine && (
                      <div>
                        <p className="text-muted-foreground">Engine</p>
                        <p className="font-medium" data-testid="text-van-engine">
                          {van.specs.engine}
                        </p>
                      </div>
                    )}
                    {van.specs.doors && (
                      <div>
                        <p className="text-muted-foreground">Doors</p>
                        <p className="font-medium" data-testid="text-van-doors">
                          {van.specs.doors}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {kit && (
            <Card>
              <CardHeader>
                <CardTitle>Equipment Package - To Install</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold" data-testid="text-kit-name">
                    {kit.name}
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-kit-description">
                    {kit.description}
                  </p>
                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-2 text-foreground">Items to Install:</p>
                    <ul className="list-disc list-inside space-y-1.5 text-sm">
                      {kit.includes.map((item, idx) => (
                        <li key={idx} className="font-medium" data-testid={`text-kit-includes-${idx}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {upgrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Equipment & Upgrades - To Install</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upgrades.map((upgrade) => {
                    const quantity = quote.selectedUpgrades?.[upgrade.id] || 1;
                    return (
                      <div
                        key={upgrade.id}
                        className="border-b pb-3 last:border-0"
                      >
                        <div className="flex items-start gap-2">
                          {quantity > 1 && (
                            <span className="font-bold text-accent text-lg">
                              {quantity}×
                            </span>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold" data-testid={`text-upgrade-name-${upgrade.id}`}>
                              {upgrade.name}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5" data-testid={`text-upgrade-description-${upgrade.id}`}>
                              {upgrade.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Build Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Current Build Stage</p>
                  <p className="text-lg font-semibold" data-testid="text-build-stage">
                    {formatBuildStage(quote.buildStage)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quote Status</p>
                  <p className="font-medium" data-testid="text-quote-status">
                    {quote.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                {quote.graphicsArtworkUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground">Graphics Artwork</p>
                    <p className="font-medium text-accent" data-testid="text-artwork-status">
                      Artwork uploaded - See attached file
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg print:mt-16">
          <p className="text-sm font-semibold text-center mb-2">Build Team Instructions</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>This is a build specification sheet for internal use only</li>
            <li>Verify all equipment and parts are available before starting build</li>
            <li>Check vehicle condition and note any pre-existing damage</li>
            <li>Follow installation guides for all equipment packages</li>
            <li>Test all installed equipment before sign-off</li>
            <li>Update build stage in system as work progresses</li>
          </ul>
        </div>
      </div>
    </>
  );
}
