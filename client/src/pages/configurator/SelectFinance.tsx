import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ConfiguratorSummary } from "@/components/ConfiguratorSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Calculator, PoundSterling } from "lucide-react";
import type { Van, Kit, Upgrade, TrainingOption } from "@shared/schema";

export default function SelectFinance() {
  const [, setLocation] = useLocation();
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

  const handleContinue = () => {
    setLocation('/configurator/quote');
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/configurator/training')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Training
            </Button>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 mt-4" data-testid="text-page-title">
              Step 5: Finance Options
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Choose a finance plan or pay outright
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            <div className="xl:col-span-2 space-y-6">
              {/* Finance Calculator Card */}
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Finance Calculator</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate your payments at 12% APR
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                        Enter a deposit amount to calculate your payments
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/configurator/training')}
                  data-testid="button-back-bottom"
                  className="w-full sm:w-auto !border-2 !border-accent text-accent hover:bg-accent/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleContinue}
                  className="bg-accent text-accent-foreground w-full sm:w-auto"
                  data-testid="button-continue"
                >
                  Continue to Quote
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            <div className="xl:col-span-1">
              <ConfiguratorSummary />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
