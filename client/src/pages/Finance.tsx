import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Calculator, TrendingUp, FileText, ArrowRight, PoundSterling } from "lucide-react";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import type { FinancePlan, Van, Kit, Upgrade, TrainingOption } from "@shared/schema";

export default function Finance() {
  const { data: financePlans = [] } = useQuery<FinancePlan[]>({
    queryKey: ['/api/finance-plans'],
  });
  
  const { state } = useConfigurator();
  const [termYears, setTermYears] = useState<number>(3);
  const [depositAmount, setDepositAmount] = useState<string>("");
  
  // Fetch selected items to get their prices
  const { data: van } = useQuery<Van>({
    queryKey: ['/api/vans', state.vanId],
    enabled: !!state.vanId,
  });

  const { data: kit } = useQuery<Kit>({
    queryKey: ['/api/kits', state.kitId],
    enabled: !!state.kitId,
  });

  const { data: upgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ['/api/upgrades'],
    select: (data) => data.filter(u => state.upgradeIds.includes(u.id)),
    enabled: state.upgradeIds.length > 0,
  });

  const { data: trainingOptions = [] } = useQuery<TrainingOption[]>({
    queryKey: ['/api/training-options'],
    select: (data) => data.filter(t => state.trainingOptionIds.includes(t.id)),
    enabled: state.trainingOptionIds.length > 0,
  });

  const formatAPR = (aprBps: number) => {
    return (aprBps / 100).toFixed(2) + '%';
  };
  
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatPriceDecimal = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // Calculate total from configurator (prices are in pence)
  const configuratorTotal = useMemo(() => {
    const vanPrice = van?.price || 0;
    const kitPrice = kit?.price || 0;
    const upgradesTotal = upgrades.reduce((sum, upgrade) => sum + upgrade.price, 0);
    const trainingTotal = trainingOptions.reduce((sum, option) => sum + option.price, 0);
    
    const subtotal = vanPrice + kitPrice + upgradesTotal + trainingTotal;
    const vat = Math.round(subtotal * 0.2);
    const totalPence = subtotal + vat;
    
    // Convert from pence to pounds
    return totalPence / 100;
  }, [van, kit, upgrades, trainingOptions]);
  
  // Calculate finance figures
  const financeCalculation = useMemo(() => {
    const deposit = parseFloat(depositAmount) || 0;
    const total = configuratorTotal || 0;
    
    if (total <= 0 || deposit >= total) {
      return null;
    }
    
    const principal = total - deposit;
    const annualRate = 0.12; // 12% APR
    const monthlyRate = annualRate / 12;
    const numberOfPayments = termYears * 12;
    
    // Monthly payment formula: M = P * [r(1 + r)^n] / [(1 + r)^n - 1]
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    // Weekly payment: (monthly × 12) ÷ 52
    const weeklyPayment = (monthlyPayment * 12) / 52;
    
    const totalRepayable = monthlyPayment * numberOfPayments;
    const totalInterest = totalRepayable - principal;
    
    return {
      principal,
      monthlyPayment,
      weeklyPayment,
      totalRepayable,
      totalInterest,
      deposit,
      total,
    };
  }, [configuratorTotal, depositAmount, termYears]);

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

      {/* Finance Calculator */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
                <Calculator className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Finance Calculator</h2>
              <p className="text-muted-foreground">
                Calculate your monthly and weekly payments based on 12% APR
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Total from Configurator */}
                  <div className="space-y-2">
                    <Label htmlFor="total" className="text-sm font-medium">
                      Total Amount
                    </Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="total"
                        type="text"
                        value={formatPrice(configuratorTotal)}
                        disabled
                        className="pl-9 bg-muted/50"
                        data-testid="input-total"
                      />
                    </div>
                    {configuratorTotal === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Start building in the <Link href="/configurator/van" className="text-accent hover:underline">configurator</Link> to see your total
                      </p>
                    )}
                  </div>

                  {/* Deposit Input */}
                  <div className="space-y-2">
                    <Label htmlFor="deposit" className="text-sm font-medium">
                      Deposit Amount
                    </Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="deposit"
                        type="number"
                        placeholder="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="pl-9"
                        min="0"
                        max={configuratorTotal}
                        data-testid="input-deposit"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter your deposit amount
                    </p>
                  </div>

                  {/* Term Length Selector */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="term" className="text-sm font-medium">
                      Finance Term
                    </Label>
                    <Select
                      value={termYears.toString()}
                      onValueChange={(value) => setTermYears(parseInt(value))}
                    >
                      <SelectTrigger id="term" data-testid="select-term">
                        <SelectValue placeholder="Select term length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Year (12 months)</SelectItem>
                        <SelectItem value="2">2 Years (24 months)</SelectItem>
                        <SelectItem value="3">3 Years (36 months)</SelectItem>
                        <SelectItem value="4">4 Years (48 months)</SelectItem>
                        <SelectItem value="5">5 Years (60 months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Results */}
                {financeCalculation ? (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Monthly Payment */}
                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Monthly Payment</p>
                        <p className="text-2xl sm:text-3xl font-bold text-accent" data-testid="text-monthly-payment">
                          {formatPriceDecimal(financeCalculation.monthlyPayment)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          for {termYears * 12} months
                        </p>
                      </div>

                      {/* Weekly Payment */}
                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Weekly Payment</p>
                        <p className="text-2xl sm:text-3xl font-bold text-accent" data-testid="text-weekly-payment">
                          {formatPriceDecimal(financeCalculation.weeklyPayment)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          approximate weekly cost
                        </p>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount Financed</p>
                        <p className="font-semibold" data-testid="text-amount-financed">
                          {formatPrice(financeCalculation.principal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Interest</p>
                        <p className="font-semibold" data-testid="text-total-interest">
                          {formatPrice(financeCalculation.totalInterest)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Repayable</p>
                        <p className="font-semibold" data-testid="text-total-repayable">
                          {formatPrice(financeCalculation.totalRepayable)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 mt-4">
                      <p className="text-xs text-muted-foreground">
                        <strong>Representative Example:</strong> {formatPrice(financeCalculation.total)} cash price, {formatPrice(financeCalculation.deposit)} deposit, 
                        amount of credit {formatPrice(financeCalculation.principal)}, {termYears * 12} monthly payments of {formatPriceDecimal(financeCalculation.monthlyPayment)}, 
                        total amount payable {formatPrice(financeCalculation.totalRepayable + financeCalculation.deposit)}, 12% APR representative.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t text-center">
                    <p className="text-sm text-muted-foreground">
                      {configuratorTotal === 0 
                        ? "Build your van in the configurator to see finance options"
                        : "Enter a deposit amount to calculate your payments"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
