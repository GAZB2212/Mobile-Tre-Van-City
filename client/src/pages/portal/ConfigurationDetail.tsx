import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Package,
  Wrench,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Truck,
  Boxes,
  CreditCard
} from "lucide-react";
import type { Quote, Van, Kit, Upgrade, FinancePlan } from "@shared/schema";
import GraphicsArtworkApproval from "@/components/GraphicsArtworkApproval";

export default function ConfigurationDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: quote, isLoading: quoteLoading } = useQuery<Quote>({
    queryKey: [`/api/portal/quotes/${id}`],
    enabled: isAuthenticated && !!id,
  });

  const { data: vans = [] } = useQuery<Van[]>({
    queryKey: ['/api/vans'],
  });

  const { data: kits = [] } = useQuery<Kit[]>({
    queryKey: ['/api/kits'],
  });

  const { data: upgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ['/api/upgrades'],
  });

  const { data: financePlans = [] } = useQuery<FinancePlan[]>({
    queryKey: ['/api/finance-plans'],
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              Please login to view this configuration.
            </p>
            <Button asChild variant="default">
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quoteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Configuration Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This configuration does not exist or you don't have access to it.
            </p>
            <Button asChild variant="default">
              <Link href="/portal">Back to Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedVan = vans.find(v => v.id === quote.vanId);
  const selectedKit = kits.find(k => k.id === quote.kitId);
  const selectedFinancePlan = financePlans.find(f => f.id === quote.financePlanId);

  // Build upgrades list with quantities
  const selectedUpgrades = quote.selectedUpgrades 
    ? Object.entries(quote.selectedUpgrades as Record<string, number>).map(([id, qty]) => ({
        upgrade: upgrades.find(u => u.id === id),
        quantity: qty
      })).filter(item => item.upgrade)
    : [];

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

  // Use server-validated totals from quote (source of truth)
  // Fallback to catalog prices only if server values are missing
  const subtotal = quote.estSubtotal || 0;
  const vat = quote.estVAT || 0;
  const total = quote.estTotal || 0;

  // Also calculate component totals for display
  const vanTotal = selectedVan?.price || 0;
  const kitTotal = selectedKit?.price || 0;
  const upgradesTotal = selectedUpgrades.reduce((sum, item) => 
    sum + ((item.upgrade?.price || 0) * item.quantity), 0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            asChild 
            className="mb-4"
            data-testid="button-back-to-portal"
          >
            <Link href="/portal">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portal
            </Link>
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-config-title">
                Configuration #{quote.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-lg text-muted-foreground">
                {quote.createdAt 
                  ? `Submitted ${new Date(quote.createdAt).toLocaleDateString()}`
                  : "Submitted recently"
                }
              </p>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(quote.status || "pending")}
              {getFinanceStatusBadge(quote.financeStatus || "pending")}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Build Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div className="text-base" data-testid="text-customer-name">
                      {quote.userName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div className="text-base" data-testid="text-customer-email">{quote.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div className="text-base" data-testid="text-customer-phone">{quote.phone}</div>
                  </div>
                  {quote.company && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Company</div>
                      <div className="text-base" data-testid="text-customer-company">{quote.company}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Van Selection */}
            {selectedVan && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Selected Van
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold" data-testid="text-van-name">
                        {selectedVan.title}
                      </h3>
                      {selectedVan.make && selectedVan.model && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedVan.make} {selectedVan.model} - {selectedVan.year}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold" data-testid="text-van-price">
                        £{(vanTotal / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Exc. VAT</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Kit Selection */}
            {selectedKit && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Boxes className="w-5 h-5" />
                    Equipment Kit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold" data-testid="text-kit-name">
                        {selectedKit.name}
                      </h3>
                      {selectedKit.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedKit.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold" data-testid="text-kit-price">
                        £{(kitTotal / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Exc. VAT</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upgrades/Equipment */}
            {selectedUpgrades.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Additional Equipment
                  </CardTitle>
                  <CardDescription>
                    Selected upgrades and modifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedUpgrades.map((item, index) => (
                      <div 
                        key={item.upgrade?.id || index} 
                        className="flex justify-between items-start"
                        data-testid={`item-upgrade-${item.upgrade?.id}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{item.upgrade?.name}</div>
                          {item.quantity > 1 && (
                            <div className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            £{(((item.upgrade?.price || 0) * item.quantity) / 100).toLocaleString()}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-muted-foreground">
                              £{((item.upgrade?.price || 0) / 100).toLocaleString()} each
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Build Progress */}
            {quote.buildStage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Build Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Current Stage</span>
                      <Badge variant="outline" data-testid="badge-build-stage">
                        {quote.buildStage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Graphics Artwork Approval */}
            <GraphicsArtworkApproval quote={quote} />

            {/* Finance Plan */}
            {selectedFinancePlan && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Finance Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan Type</span>
                      <span className="font-medium" data-testid="text-finance-type">
                        {selectedFinancePlan.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Term</span>
                      <span className="font-medium" data-testid="text-finance-term">
                        {quote.financeInputs?.term || selectedFinancePlan.termMonths} months
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">APR</span>
                      <span className="font-medium" data-testid="text-finance-apr">
                        {(selectedFinancePlan.aprBps / 100).toFixed(2)}%
                      </span>
                    </div>
                    {quote.financeInputs?.deposit && quote.financeInputs.deposit > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deposit</span>
                        <span className="font-medium" data-testid="text-finance-deposit">
                          £{(quote.financeInputs.deposit / 100).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {quote.financeInputs?.balloon && quote.financeInputs.balloon > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Balloon Payment</span>
                        <span className="font-medium" data-testid="text-finance-balloon">
                          £{(quote.financeInputs.balloon / 100).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-notes">
                    {quote.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Price Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Price Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Van</span>
                    <span data-testid="text-summary-van">
                      £{(vanTotal / 100).toLocaleString()}
                    </span>
                  </div>
                  
                  {kitTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kit</span>
                      <span data-testid="text-summary-kit">
                        £{(kitTotal / 100).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {upgradesTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Equipment</span>
                      <span data-testid="text-summary-upgrades">
                        £{(upgradesTotal / 100).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium" data-testid="text-summary-subtotal">
                      £{(subtotal / 100).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT (20%)</span>
                    <span className="font-medium" data-testid="text-summary-vat">
                      £{(vat / 100).toLocaleString()}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-accent" data-testid="text-summary-total">
                      £{(total / 100).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground text-center">
                    All prices include VAT
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
