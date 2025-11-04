import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Loader2, XCircle, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Quote } from "@shared/schema";

export default function QuoteConfirmation() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [confirmed, setConfirmed] = useState(false);

  const { data: quote, isLoading, error } = useQuery<Quote>({
    queryKey: [`/api/quote/confirm/${token}`],
    enabled: !!token,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/quote/confirm/${token}`);
    },
    onSuccess: () => {
      setConfirmed(true);
      toast({
        title: "Quote Confirmed!",
        description: "Thank you for confirming your quote. We'll be in touch soon.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to confirm quote. Please try again.",
      });
    },
  });

  // Use server-calculated pricing (discount already applied server-side for security)
  const calculateAdjustedPrice = () => {
    if (!quote) return { subtotal: 0, discount: 0, subtotalAfterDiscount: 0, vat: 0, total: 0 };

    return {
      subtotal: quote.estSubtotal, // Base price before discount
      discount: quote.estDiscount || 0, // Server-calculated discount amount
      subtotalAfterDiscount: quote.estSubtotal - (quote.estDiscount || 0),
      vat: quote.estVAT, // Server-calculated VAT (after discount)
      total: quote.estTotal, // Server-calculated total (after discount)
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your quote...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="py-12 text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Quote Not Found</h1>
              <p className="text-muted-foreground mb-6">
                This confirmation link is invalid or has expired.
              </p>
              <Button onClick={() => setLocation("/")} data-testid="button-home">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (confirmed || quote.status === "confirmed") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-20 h-20 text-accent mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">Quote Confirmed!</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Thank you for confirming your quote. Our team will be in touch shortly to proceed with your order.
              </p>
              <Button onClick={() => setLocation("/")} data-testid="button-home">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const pricing = calculateAdjustedPrice();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Confirm Your Quote</h1>
            <p className="text-lg text-muted-foreground">
              Please review the details below and confirm if everything looks correct
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Quote Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div>{quote.userName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div>{quote.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div>{quote.phone}</div>
                  </div>
                  {quote.company && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Company</div>
                      <div>{quote.company}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {quote.customerNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Notes from Our Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{quote.customerNotes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Price Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Price Summary</CardTitle>
                  <CardDescription>Quote #{quote.id.slice(0, 8).toUpperCase()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      £{(pricing.subtotal / 100).toLocaleString()}
                    </span>
                  </div>
                  
                  {pricing.discount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-accent font-medium">
                          Discount {quote.discountType === "percentage" ? `(${quote.discountValue}%)` : ""}
                        </span>
                        <span className="text-accent font-medium">
                          -£{(pricing.discount / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal After Discount</span>
                        <span className="font-medium">
                          £{(pricing.subtotalAfterDiscount / 100).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT (20%)</span>
                    <span className="font-medium">
                      £{(pricing.vat / 100).toLocaleString()}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-accent">
                      £{(pricing.total / 100).toLocaleString()}
                    </span>
                  </div>

                  {pricing.discount > 0 && (
                    <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
                      <p className="text-sm text-center">
                        <span className="font-semibold text-accent">You Save: </span>
                        <span className="font-bold text-accent">
                          £{(pricing.discount / 100).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-accent">
                <CardContent className="py-6">
                  <Button
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
                    data-testid="button-confirm-quote"
                  >
                    {confirmMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirm Quote
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    By confirming, you agree to proceed with this quote
                  </p>
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
