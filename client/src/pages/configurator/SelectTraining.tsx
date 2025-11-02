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
import { ArrowRight, ArrowLeft, GraduationCap, Clock, CheckCircle } from "lucide-react";
import { PoundSterling } from "lucide-react";
import type { TrainingOption } from "@shared/schema";

export default function SelectTraining() {
  const [, setLocation] = useLocation();
  const { state, addTrainingOption, removeTrainingOption } = useConfigurator();

  const { data: configuratorData, isLoading } = useQuery<{
    trainingOptions: TrainingOption[];
  }>({
    queryKey: ['/api/configurator/data'],
  });

  const trainingOptions = configuratorData?.trainingOptions || [];

  const isSelected = (optionId: string) => {
    return state.trainingOptionIds.includes(optionId);
  };

  const handleToggleTraining = (optionId: string) => {
    if (isSelected(optionId)) {
      removeTrainingOption(optionId);
    } else {
      addTrainingOption(optionId);
    }
  };

  const handleContinue = () => {
    setLocation('/configurator/finance');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/configurator/upgrades')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upgrades
            </Button>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 mt-4" data-testid="text-page-title">
              Step 4: Optional Training
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Select professional training programmes to enhance your business capabilities
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
                  {trainingOptions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {trainingOptions.map((option) => (
                        <Card 
                          key={option.id} 
                          className={`hover-elevate cursor-pointer ${isSelected(option.id) ? 'ring-2 ring-accent' : ''}`}
                          onClick={() => handleToggleTraining(option.id)}
                          data-testid={`card-training-option-${option.id}`}
                        >
                          <CardHeader>
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <Badge variant={option.type === 'REACT' ? 'default' : 'secondary'} className="text-xs sm:text-sm" data-testid={`badge-training-type-${option.id}`}>
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {option.type === 'REACT' ? 'Motorway Safety' : 'Tyre Fitting'}
                              </Badge>
                              {isSelected(option.id) && (
                                <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm">
                                  <CheckCircle className="w-3 h-3" />
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg sm:text-xl break-words" data-testid={`text-training-name-${option.id}`}>
                              {option.name}
                            </CardTitle>
                            <CardDescription className="text-sm break-words line-clamp-3" data-testid={`text-training-description-${option.id}`}>
                              {option.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center justify-between gap-4 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                                  <Clock className="w-4 h-4 flex-shrink-0" />
                                  <span className="whitespace-nowrap">Duration</span>
                                </div>
                                <span className="font-medium whitespace-nowrap" data-testid={`text-training-duration-${option.id}`}>
                                  {option.durationDays} {option.durationDays === 1 ? 'day' : 'days'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                                  <PoundSterling className="w-4 h-4 flex-shrink-0" />
                                  <span className="whitespace-nowrap">Price</span>
                                </div>
                                <span className="font-medium whitespace-nowrap" data-testid={`text-training-price-${option.id}`}>
                                  {formatPrice(option.price)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-20 text-center">
                        <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No training options available at this time.</p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Button 
                      onClick={handleContinue}
                      size="lg"
                      className="flex-1 bg-accent text-accent-foreground"
                      data-testid="button-continue"
                    >
                      Continue to Finance
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            <div className="xl:col-span-1">
              <div className="sticky top-6">
                <ConfiguratorSummary />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
