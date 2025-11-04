import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { FileText, LogOut, Package, Truck, Calendar, Mail, Phone, User, Building } from "lucide-react";
import type { Quote, User as UserType } from "@shared/schema";

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading: isLoadingUser } = useQuery<UserType>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const { data: quotes = [], isLoading: isLoadingQuotes } = useQuery<Quote[]>({
    queryKey: ['/api/customer/quotes'],
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      toast({
        title: "Logged Out",
        description: "You've been successfully logged out.",
      });
      setLocation('/customer/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.isAdmin) {
    setLocation('/customer/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
                My Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user.email}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground break-all">{user.email}</span>
                </div>
                <div className="pt-3 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation('/configurator/van')}
                    data-testid="button-new-quote"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Request New Quote
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>My Quotes</CardTitle>
                  <CardDescription>
                    View all your quote requests and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingQuotes ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : quotes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Quotes Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your custom van configuration
                      </p>
                      <Button onClick={() => setLocation('/configurator/van')} data-testid="button-first-quote">
                        Create Your First Quote
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quotes.map((quote) => (
                        <Card key={quote.id} data-testid={`card-quote-${quote.id}`}>
                          <CardContent className="pt-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {formatDate(quote.createdAt)}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-lg" data-testid={`text-quote-total-${quote.id}`}>
                                  {formatPrice(quote.estTotal)}
                                </h3>
                              </div>
                              <div className="flex gap-2">
                                <span className="px-3 py-1 rounded-full text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                  Pending Review
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Name</p>
                                    <p className="text-sm font-medium">{quote.userName}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="text-sm font-medium break-all">{quote.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="text-sm font-medium">{quote.phone}</p>
                                  </div>
                                </div>
                                {quote.company && (
                                  <div className="flex items-start gap-2">
                                    <Building className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Company</p>
                                      <p className="text-sm font-medium">{quote.company}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">Configuration</p>
                                  <div className="space-y-1">
                                    {quote.vanId && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Truck className="w-3 h-3 text-accent" />
                                        <span>Van Selected</span>
                                      </div>
                                    )}
                                    {quote.kitId && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Package className="w-3 h-3 text-accent" />
                                        <span>Equipment Kit</span>
                                      </div>
                                    )}
                                    {quote.selectedUpgradeIds.length > 0 && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Package className="w-3 h-3 text-accent" />
                                        <span>{quote.selectedUpgradeIds.length} Upgrades</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Pricing Estimate</p>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Subtotal</span>
                                      <span>{formatPrice(quote.estSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">VAT (20%)</span>
                                      <span>{formatPrice(quote.estVAT)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1 border-t">
                                      <span>Total</span>
                                      <span className="text-accent">{formatPrice(quote.estTotal)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {quote.notes && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                <p className="text-sm">{quote.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
