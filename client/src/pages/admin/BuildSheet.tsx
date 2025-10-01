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

  const formatPrice = (pence: number): string => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | Date | null): string => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm" data-testid="text-customer-notes">
                    {quote.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {van && (
            <Card>
              <CardHeader>
                <CardTitle>Base Vehicle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold" data-testid="text-van-title">
                    {van.make} {van.model} ({van.year})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                      <p className="text-muted-foreground">Fuel</p>
                      <p className="font-medium" data-testid="text-van-fuel">
                        {van.specs.fuel}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium" data-testid="text-van-size">
                        {van.specs.size}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Van Price</p>
                    <p className="text-lg font-bold" data-testid="text-van-price">
                      {formatPrice(van.price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {kit && (
            <Card>
              <CardHeader>
                <CardTitle>Equipment Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold" data-testid="text-kit-name">
                    {kit.name}
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-kit-description">
                    {kit.description}
                  </p>
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Package Includes:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {kit.includes.map((item, idx) => (
                        <li key={idx} data-testid={`text-kit-includes-${idx}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Package Price</p>
                    <p className="text-lg font-bold" data-testid="text-kit-price">
                      {formatPrice(kit.price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {upgrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Equipment & Upgrades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upgrades.map((upgrade) => (
                    <div
                      key={upgrade.id}
                      className="flex justify-between items-start border-b pb-2 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-upgrade-name-${upgrade.id}`}>
                          {upgrade.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-upgrade-description-${upgrade.id}`}>
                          {upgrade.description}
                        </p>
                      </div>
                      <p className="font-medium ml-4 whitespace-nowrap" data-testid={`text-upgrade-price-${upgrade.id}`}>
                        {formatPrice(upgrade.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {financePlan && (
            <Card>
              <CardHeader>
                <CardTitle>Finance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold" data-testid="text-finance-name">
                    {financePlan.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium" data-testid="text-finance-type">
                        {financePlan.type === 'HP' ? 'Hire Purchase' : 'Lease'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Term</p>
                      <p className="font-medium" data-testid="text-finance-term">
                        {financePlan.termMonths} months
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">APR</p>
                      <p className="font-medium" data-testid="text-finance-apr">
                        {(financePlan.aprBps / 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deposit</p>
                      <p className="font-medium" data-testid="text-finance-deposit">
                        {financePlan.depositPercent}%
                      </p>
                    </div>
                    {financePlan.balloonPercent && (
                      <div>
                        <p className="text-muted-foreground">Balloon Payment</p>
                        <p className="font-medium" data-testid="text-finance-balloon">
                          {financePlan.balloonPercent}%
                        </p>
                      </div>
                    )}
                  </div>
                  {financePlan.notes && (
                    <p className="text-sm text-muted-foreground mt-2" data-testid="text-finance-notes">
                      {financePlan.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Price Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium" data-testid="text-subtotal">
                    {formatPrice(quote.estSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (20%)</span>
                  <span className="font-medium" data-testid="text-vat">
                    {formatPrice(quote.estVAT)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-accent" data-testid="text-total">
                    {formatPrice(quote.estTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground print:mt-16">
          <p>This is a build specification sheet for internal use only.</p>
          <p>Final pricing and specifications subject to confirmation.</p>
        </div>
      </div>
    </>
  );
}
