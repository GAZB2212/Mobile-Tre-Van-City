import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Loader2, XCircle, MessageSquare, Truck, Wrench, PoundSterling, AlertCircle } from "lucide-react";
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
    if (!quote) return { subtotal: 0, discount: 0, subtotalAfterDiscount: 0, vat: 0, total: 0, originalTotal: 0 };

    // estTotal, estVAT, and estSubtotal already reflect the final values AFTER discount
    const finalTotal = quote.estTotal;
    const finalVAT = quote.estVAT;
    const finalSubtotal = quote.estSubtotal;

    // Calculate discount amount and original price
    // Use server-stored discount amount for accuracy
    const discountAmount = quote.estDiscount || 0;
    const originalTotal = finalTotal + discountAmount;

    return {
      subtotal: finalSubtotal, // Final subtotal (ex VAT) after discount
      discount: discountAmount, // Calculated discount amount
      subtotalAfterDiscount: finalSubtotal, // Same as subtotal (already after discount)
      vat: finalVAT, // Final VAT after discount
      total: finalTotal, // Final total after discount
      originalTotal: originalTotal, // Original total before discount (for display purposes)
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

  if (confirmed || quote.status === "deposit_taken" || quote.status === "in_build" || quote.status === "completed") {
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

          {/* Full Configuration Summary */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Configuration</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Van Details */}
              {(quote as any).van && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Selected Van
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-lg font-semibold">{(quote as any).van.make} {(quote as any).van.model}</div>
                      <div className="text-sm text-muted-foreground">{(quote as any).van.year}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Mileage</div>
                        <div className="font-medium">{(quote as any).van.mileage?.toLocaleString()} miles</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Transmission</div>
                        <div className="font-medium">{(quote as any).van.transmission}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Fuel</div>
                        <div className="font-medium">{(quote as any).van.fuel}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Engine</div>
                        <div className="font-medium">{(quote as any).van.engineSize}L</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-accent pt-2">
                      £{((quote as any).van.price / 100).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Kit Details */}
              {(quote as any).kit && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Equipment Kit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-lg font-semibold">{(quote as any).kit.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">{(quote as any).kit.description}</div>
                    </div>
                    <div className="text-sm font-semibold text-accent pt-2">
                      £{((quote as any).kit.price / 100).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Equipment & Upgrades List */}
            {(quote as any).upgrades && (quote as any).upgrades.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Additional Equipment & Upgrades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(quote as any).upgrades.map((upgrade: any) => (
                      <div key={upgrade.id} className="flex justify-between items-start pb-3 border-b last:border-0">
                        <div className="flex-1">
                          <div className="font-medium">{upgrade.name}</div>
                          {upgrade.variantName && (
                            <div className="text-sm text-muted-foreground">{upgrade.variantName}</div>
                          )}
                          {upgrade.quantity > 1 && (
                            <div className="text-sm text-accent font-medium">Qty: {upgrade.quantity}</div>
                          )}
                        </div>
                        <div className="text-sm font-semibold">
                          £{((upgrade.price * upgrade.quantity) / 100).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Customer Info */}
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

              {/* Finance Details */}
              {(quote as any).financePlan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PoundSterling className="w-5 h-5" />
                      Finance Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Finance Plan</div>
                      <div className="font-semibold">{(quote as any).financePlan.name}</div>
                      <div className="text-xs text-muted-foreground">{(quote as any).financePlan.type}</div>
                    </div>

                    {(() => {
                      const plan = (quote as any).financePlan;
                      const inputs = (quote as any).financeInputs || {};
                      const depositPercent = inputs.deposit || plan.depositPercent;
                      const termMonths = inputs.term || plan.termMonths;
                      const balloonPercent = inputs.balloon || plan.balloonPercent || 0;
                      
                      const depositAmount = Math.round((pricing.total * depositPercent) / 100);
                      const balloonAmount = Math.round((pricing.total * balloonPercent) / 100);
                      const amountToFinance = pricing.total - depositAmount;
                      
                      const aprDecimal = plan.aprBps / 10000;
                      const monthlyRate = aprDecimal / 12;
                      
                      let monthlyPayment = 0;
                      if (monthlyRate > 0) {
                        // For balloon payments, subtract the present value of the balloon
                        const balloonPV = balloonAmount / Math.pow(1 + monthlyRate, termMonths);
                        const netFinance = amountToFinance - balloonPV;
                        monthlyPayment = Math.round(
                          (netFinance * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
                          (Math.pow(1 + monthlyRate, termMonths) - 1)
                        );
                      } else {
                        // Zero interest - simple division
                        monthlyPayment = Math.round((amountToFinance - balloonAmount) / termMonths);
                      }

                      return (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Deposit ({depositPercent}%)</span>
                              <span className="font-medium">£{(depositAmount / 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Term</span>
                              <span className="font-medium">{termMonths} months</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">APR</span>
                              <span className="font-medium">{(plan.aprBps / 100).toFixed(2)}%</span>
                            </div>
                            {balloonAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Final Balloon Payment</span>
                                <span className="font-medium">£{(balloonAmount / 100).toLocaleString()}</span>
                              </div>
                            )}
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Monthly Payment</span>
                              <span className="text-xl font-bold text-accent">
                                £{(monthlyPayment / 100).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

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

          {/* FCA-Compliant Finance Disclaimers */}
          {(quote as any).financePlan && (
            <Card className="mt-8 border-muted-foreground/20 bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="w-5 h-5" />
                  Important Finance Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Finance is subject to status and approval. Terms and conditions apply.
                </p>
                <p>
                  <strong>Credit Subject to Status:</strong> All finance is subject to status and income. Written quotation available on request. We act as a credit broker not a lender. We work with a number of carefully selected credit providers who may be able to offer you finance for your purchase. We are only able to offer finance products from these providers.
                </p>
                <p>
                  <strong>Regulatory Information:</strong> We are regulated by the Financial Conduct Authority (FCA) for consumer credit activities. Our FCA registration can be verified on the FCA register.
                </p>
                <p>
                  <strong>Representative Example:</strong> The monthly payment and total amount payable shown are indicative only and based on the information provided. Your actual quote may vary depending on your personal circumstances and credit assessment. The APR (Annual Percentage Rate) represents the total cost of credit expressed as an annual percentage of the amount of credit.
                </p>
                <p>
                  <strong>Responsible Lending:</strong> We are committed to responsible lending. Before entering into any credit agreement, please ensure you can afford the monthly repayments. Missing payments could affect your credit rating and may result in additional charges.
                </p>
                <p>
                  <strong>Right to Withdraw:</strong> You have the right to withdraw from this credit agreement within 14 days of signing without giving any reason. To exercise your right to withdraw, you must inform us of your decision by a clear statement.
                </p>
                <p>
                  <strong>Data Protection:</strong> Your personal information will be processed in accordance with data protection legislation and our privacy policy. We may share your information with credit reference agencies and fraud prevention agencies.
                </p>
                <p className="font-semibold text-foreground pt-2">
                  This quote does not constitute a binding offer. All finance is subject to final credit approval and underwriting.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
