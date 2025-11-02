import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ConfiguratorSummary } from "@/components/ConfiguratorSummary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowRight, ArrowLeft, TrendingUp, Calendar, Percent } from "lucide-react";
import type { FinancePlan } from "@shared/schema";

export default function SelectFinance() {
  const [, setLocation] = useLocation();
  const { state, setFinancePlan } = useConfigurator();

  const { data: financePlans = [], isLoading } = useQuery<FinancePlan[]>({
    queryKey: ['/api/finance-plans'],
  });

  const handleSelectPlan = (planId: string) => {
    setFinancePlan(planId);
    setLocation('/configurator/quote');
  };

  const handleSkipFinance = () => {
    setFinancePlan(null);
    setLocation('/configurator/quote');
  };

  const formatAPR = (aprBps: number) => {
    return (aprBps / 100).toFixed(2) + '%';
  };

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
            <div className="xl:col-span-2">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {financePlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`hover-elevate cursor-pointer ${state.financePlanId === plan.id ? 'ring-2 ring-accent' : ''}`}
                    onClick={() => handleSelectPlan(plan.id)}
                    data-testid={`card-finance-plan-${plan.id}`}
                  >
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <Badge variant={plan.type === 'HP' ? 'default' : 'secondary'} className="text-xs sm:text-sm" data-testid={`badge-plan-type-${plan.id}`}>
                          {plan.type === 'HP' ? 'Hire Purchase' : 'Lease'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm" data-testid={`badge-plan-apr-${plan.id}`}>
                          <Percent className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatAPR(plan.aprBps)} APR</span>
                        </Badge>
                      </div>
                      <CardTitle className="text-lg sm:text-xl break-words" data-testid={`text-plan-name-${plan.id}`}>
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-sm break-words" data-testid={`text-plan-notes-${plan.id}`}>
                        {plan.notes}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Term</span>
                          </div>
                          <span className="font-medium whitespace-nowrap" data-testid={`text-plan-term-${plan.id}`}>
                            {plan.termMonths} months
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                            <TrendingUp className="w-4 h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Deposit</span>
                          </div>
                          <span className="font-medium whitespace-nowrap" data-testid={`text-plan-deposit-${plan.id}`}>
                            {plan.depositPercent}%
                          </span>
                        </div>
                        {plan.balloonPercent && (
                          <div className="flex items-center justify-between gap-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                              <TrendingUp className="w-4 h-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">Balloon</span>
                            </div>
                            <span className="font-medium whitespace-nowrap" data-testid={`text-plan-balloon-${plan.id}`}>
                              {plan.balloonPercent}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className={`w-full ${state.financePlanId === plan.id ? 'bg-accent text-accent-foreground' : 'border-2 border-accent text-accent hover:bg-accent/10'}`}
                        variant={state.financePlanId === plan.id ? "default" : "outline"}
                        data-testid={`button-select-plan-${plan.id}`}
                      >
                        {state.financePlanId === plan.id ? 'Selected' : 'Select Plan'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleSkipFinance}
                  data-testid="button-skip-finance"
                >
                  Skip - Pay Outright
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
                </>
              )}
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
