import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, FileText, ArrowRight, Calculator } from "lucide-react";
import type { FinancePlan } from "@shared/schema";

export default function Finance() {
  const { data: financePlans = [] } = useQuery<FinancePlan[]>({
    queryKey: ['/api/finance-plans'],
  });

  const formatAPR = (aprBps: number) => {
    return (aprBps / 100).toFixed(2) + '%';
  };

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
