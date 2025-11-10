import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, TrendingUp, FileText, ArrowRight, Calculator, PoundSterling } from "lucide-react";
import type { FinancePlan } from "@shared/schema";

export default function Finance() {
  const { data: financePlans = [] } = useQuery<FinancePlan[]>({
    queryKey: ['/api/finance-plans'],
  });

  const [purchasePrice, setPurchasePrice] = useState<string>("35000");
  const [customDeposit, setCustomDeposit] = useState<string>("3500");
  const [customTerm, setCustomTerm] = useState<string>("60");
  const [customBalloon, setCustomBalloon] = useState<string>("0");
  const [selectedAPR, setSelectedAPR] = useState<string>("599");

  const formatAPR = (aprBps: number) => {
    return (aprBps / 100).toFixed(2) + '%';
  };

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateFinance = (plan: FinancePlan, purchasePricePence: number) => {
    const depositAmount = Math.round(purchasePricePence * (plan.depositPercent / 100));
    const balloonAmount = plan.balloonPercent 
      ? Math.round(purchasePricePence * (plan.balloonPercent / 100))
      : 0;
    const amountToFinance = purchasePricePence - depositAmount;
    const principal = amountToFinance - balloonAmount;
    const termMonths = plan.termMonths;
    
    let monthlyPayment: number;
    
    if (plan.aprBps === 0) {
      monthlyPayment = Math.round((amountToFinance - balloonAmount) / termMonths);
    } else {
      const monthlyRate = (plan.aprBps / 10000) / 12;
      const numberOfPayments = termMonths;
      
      monthlyPayment = Math.round(
        principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
      );
    }
    
    const totalRepayable = (monthlyPayment * termMonths) + depositAmount + balloonAmount;
    
    return {
      depositAmount,
      monthlyPayment,
      balloonAmount,
      totalRepayable,
      termMonths
    };
  };

  const calculateCustomFinance = (
    purchasePricePence: number,
    depositPence: number,
    termMonths: number,
    balloonPence: number,
    aprBps: number
  ) => {
    const amountToFinance = purchasePricePence - depositPence;
    const principal = amountToFinance - balloonPence;
    
    let monthlyPayment: number;
    
    if (aprBps === 0) {
      monthlyPayment = Math.round(principal / termMonths);
    } else {
      const monthlyRate = (aprBps / 10000) / 12;
      const numberOfPayments = termMonths;
      
      monthlyPayment = Math.round(
        principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
      );
    }
    
    const totalRepayable = (monthlyPayment * termMonths) + depositPence + balloonPence;
    
    return {
      depositAmount: depositPence,
      monthlyPayment,
      balloonAmount: balloonPence,
      totalRepayable,
      termMonths
    };
  };

  const purchasePricePence = Math.round(parseFloat(purchasePrice || "0") * 100);
  const isValidPrice = purchasePricePence > 0;
  
  const customDepositPence = Math.round(parseFloat(customDeposit || "0") * 100);
  const customTermMonths = parseInt(customTerm || "0");
  const customBalloonPence = Math.round(parseFloat(customBalloon || "0") * 100);
  const customAPRBps = parseInt(selectedAPR || "0");
  
  const isValidCustom = purchasePricePence > 0 && customDepositPence >= 0 && customTermMonths > 0 && customDepositPence <= purchasePricePence;
  
  const customCalc = isValidCustom 
    ? calculateCustomFinance(purchasePricePence, customDepositPence, customTermMonths, customBalloonPence, customAPRBps)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Van Finance Options - Flexible Payment Plans"
        description="Spread the cost of your mobile tyre van with our competitive finance packages. FCA authorised. Hire purchase and lease options available with affordable monthly payments."
        canonical="/finance"
      />
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-card to-background border-b py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              FCA Authorised
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-finance-title">
              Flexible Finance Options
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Spread the cost of your mobile tyre van with our competitive finance packages. Get on the road faster with affordable monthly payments.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why Finance Your Van?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <CardTitle className="text-lg">Preserve Cash Flow</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Keep your working capital for day-to-day operations while getting the van you need to grow your business.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-accent" />
                    </div>
                    <CardTitle className="text-lg">Fixed Monthly Payments</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Budget accurately with predictable monthly costs. No surprises, just straightforward payments.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-accent" />
                    </div>
                    <CardTitle className="text-lg">Quick Approval</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Fast decision process so you can get your mobile tyre van on the road without delays.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <CardTitle className="text-lg">Flexible Terms</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Choose the plan that works for you with various term lengths and deposit options available.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Finance Plans */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Available Finance Plans</h2>
              <p className="text-muted-foreground">
                Compare our finance options and choose the plan that best suits your business needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {financePlans.map((plan) => (
                <Card key={plan.id} className="hover-elevate" data-testid={`card-finance-${plan.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={plan.type === 'HP' ? 'default' : 'secondary'}>
                        {plan.type === 'HP' ? 'Hire Purchase' : 'Lease'}
                      </Badge>
                      <Badge variant="outline" className="text-accent">
                        {formatAPR(plan.aprBps)} APR
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.notes}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Term Length</span>
                        <span className="font-medium">{plan.termMonths} months</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deposit</span>
                        <span className="font-medium">{plan.depositPercent}%</span>
                      </div>
                      {plan.balloonPercent && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Balloon Payment</span>
                          <span className="font-medium">{plan.balloonPercent}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild data-testid="button-get-quote">
                <Link href="/configurator/van">
                  Get a Finance Quote
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Finance Calculator */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                <Calculator className="w-3 h-3 mr-1" />
                Calculator
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Finance Calculator</h2>
              <p className="text-muted-foreground">
                Enter your purchase price to see estimated monthly payments for each finance plan
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Purchase Price</CardTitle>
                <CardDescription>Enter the total price of your van including all equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative max-w-xs">
                  <Label htmlFor="purchase-price" className="sr-only">Purchase Price</Label>
                  <div className="relative">
                    <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="purchase-price"
                      type="number"
                      min="0"
                      step="100"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="pl-10"
                      placeholder="35000"
                      data-testid="input-purchase-price"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {isValidPrice && financePlans.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {financePlans.map((plan) => {
                  const calc = calculateFinance(plan, purchasePricePence);
                  return (
                    <Card key={plan.id} className="hover-elevate" data-testid={`card-calculator-${plan.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant={plan.type === 'HP' ? 'default' : 'secondary'}>
                            {plan.type === 'HP' ? 'Hire Purchase' : 'Lease'}
                          </Badge>
                          <Badge variant="outline" className="text-accent">
                            {formatAPR(plan.aprBps)} APR
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription>{calc.termMonths} month term</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-accent/5 rounded-md border border-accent/10">
                            <div className="text-sm text-muted-foreground mb-1">Monthly Payment</div>
                            <div className="text-2xl font-bold text-accent" data-testid={`text-monthly-${plan.id}`}>
                              {formatPrice(calc.monthlyPayment)}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Deposit ({plan.depositPercent}%)</span>
                              <span className="font-medium" data-testid={`text-deposit-${plan.id}`}>
                                {formatPrice(calc.depositAmount)}
                              </span>
                            </div>
                            
                            {calc.balloonAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Balloon Payment ({plan.balloonPercent}%)</span>
                                <span className="font-medium" data-testid={`text-balloon-${plan.id}`}>
                                  {formatPrice(calc.balloonAmount)}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between text-sm pt-2 border-t">
                              <span className="text-muted-foreground">Total Payable</span>
                              <span className="font-medium" data-testid={`text-total-${plan.id}`}>
                                {formatPrice(calc.totalRepayable)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!isValidPrice && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Enter a purchase price above to see finance calculations</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Important Information */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Finance is subject to status. Terms and conditions apply. We are a credit broker and not a lender. 
              We can introduce you to a limited number of lenders who may be able to offer you finance facilities for your purchase.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
