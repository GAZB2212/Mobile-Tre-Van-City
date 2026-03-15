import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConfiguratorStepper from "@/components/ConfiguratorStepper";
import { ConfiguratorSummary } from "@/components/ConfiguratorSummary";
import { ConfiguratorTutorial } from "@/components/ConfiguratorTutorial";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowRight, ArrowLeft, GraduationCap, Clock, CheckCircle, Info, Shield, BookOpen, Users, Calendar, MapPin, PoundSterling as PoundIcon } from "lucide-react";
import { PoundSterling } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import type { TrainingOption } from "@shared/schema";

// Detailed training content
const trainingDetails: Record<string, {
  overview: string;
  whyEssential: string[];
  courseIncludes: string[];
  whoItsFor: string[];
  durationInfo: string;
  locationInfo: string;
}> = {
  REACT: {
    overview: "Every mobile tyre technician working on live carriageways or motorways must hold a valid REACT Licence (Roadside Emergency Action Concerning Technicians). This nationally recognised qualification is endorsed by the National Tyre Distributors Association (NTDA) and forms part of the official Tyre Technician Professional Development Scheme (TTPDS).",
    whyEssential: [
      "Work safely at the roadside and on live carriageways",
      "Correctly position your van, cones, and signage",
      "Use PPE and equipment in compliance with Highways England guidance",
      "Manage incidents, emergency stops, and recovery situations",
      "Protect yourself, your customers, and passing traffic",
    ],
    courseIncludes: [
      "Health & Safety Legislation – understanding roadside risk and legal responsibilities",
      "Vehicle Preparation & Equipment Checks",
      "Site Assessment & Positioning – safe van placement, coning and signage",
      "Working Safely on Motorways & Dual Carriageways",
      "Emergency Procedures – dealing with breakdowns, accidents, and hazards",
      "Incident Reporting & Post-Job Safety Checks",
    ],
    whoItsFor: [
      "New mobile tyre business owners",
      "Commercial and fleet technicians",
      "Franchisees purchasing a mobile tyre van",
      "Any technician attending breakdowns on motorways, dual carriageways, or trunk roads",
    ],
    durationInfo: "1 day (typically 6 hours)",
    locationInfo: "In-person classroom + safety briefing practical at Wirral / Chester training centre (on-site options available)",
  },
  "Tyre Fitting": {
    overview: "Comprehensive hands-on training covering all aspects of professional tyre fitting. This practical course provides the essential skills and knowledge needed to safely and efficiently fit tyres on cars, vans, and light commercial vehicles. Perfect for new technicians or those looking to enhance their tyre fitting expertise.",
    whyEssential: [
      "Master safe and efficient tyre fitting techniques",
      "Learn proper use of tyre fitting equipment and machinery",
      "Understand wheel balancing and alignment principles",
      "Ensure customer safety through correct fitting procedures",
      "Build confidence in handling different tyre types and sizes",
    ],
    courseIncludes: [
      "Tyre Construction & Specifications – understanding tyre types, sizes, and ratings",
      "Equipment Operation – safe use of tyre changers, balancers, and hand tools",
      "Fitting Procedures – step-by-step fitting for cars and commercial vehicles",
      "Wheel Balancing – static and dynamic balancing techniques",
      "TPMS Systems – working with tyre pressure monitoring systems",
      "Health & Safety – risk assessment, manual handling, and workshop safety",
      "Customer Care – professional communication and quality checks",
    ],
    whoItsFor: [
      "New mobile tyre technicians",
      "Existing technicians wanting to improve their skills",
      "Mobile tyre business owners",
      "Individuals starting a career in the tyre industry",
    ],
    durationInfo: "1 day (typically 6 hours)",
    locationInfo: "Hands-on practical training at Wirral / Chester training centre",
  },
};

export default function SelectTraining() {
  const [, setLocation] = useLocation();
  const { state, addTrainingOption, removeTrainingOption } = useConfigurator();
  const [selectedTrainingInfo, setSelectedTrainingInfo] = useState<TrainingOption | null>(null);

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
            
            <ConfiguratorStepper currentPath="/configurator/training" />

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 mt-4" data-testid="text-page-title">
              Optional Training
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" data-testid="grid-training">
                      {trainingOptions.map((option) => (
                        <Card 
                          key={option.id} 
                          className={`hover-elevate ${isSelected(option.id) ? 'ring-2 ring-accent' : ''}`}
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
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTrainingInfo(option);
                                }}
                                className="flex-1"
                                data-testid={`button-more-info-${option.id}`}
                              >
                                <Info className="w-4 h-4 mr-2" />
                                More Info
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTraining(option.id);
                                }}
                                className={`flex-1 ${isSelected(option.id) ? 'bg-accent text-accent-foreground border-accent' : 'bg-transparent text-accent border-2 border-accent hover:bg-accent hover:text-accent-foreground'}`}
                                data-testid={`button-toggle-training-${option.id}`}
                              >
                                {isSelected(option.id) ? 'Selected' : 'Select'}
                              </Button>
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

      {/* Training Details Dialog */}
      <Dialog open={!!selectedTrainingInfo} onOpenChange={() => setSelectedTrainingInfo(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl flex items-center gap-3">
              <Shield className="w-8 h-8 text-accent" />
              {selectedTrainingInfo?.name}
            </DialogTitle>
            <DialogDescription>
              Professional training course - £{((selectedTrainingInfo?.price || 0) / 100).toFixed(2)} + VAT
            </DialogDescription>
          </DialogHeader>

          {selectedTrainingInfo && trainingDetails[selectedTrainingInfo.type] && (
            <div className="space-y-6 mt-4">
              {/* Overview */}
              <div>
                <p className="text-muted-foreground leading-relaxed">
                  {trainingDetails[selectedTrainingInfo.type].overview}
                </p>
              </div>

              {/* Why It's Essential */}
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Why It's Essential
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Working on motorways, dual carriageways, and trunk roads is one of the most hazardous environments for any technician. The REACT licence ensures you have the skills, awareness, and procedures to:
                </p>
                <ul className="space-y-2 ml-4">
                  {trainingDetails[selectedTrainingInfo.type].whyEssential.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  Holding a REACT licence not only protects your life — it also demonstrates professional credibility to fleet operators, insurers, and customers.
                </p>
              </div>

              {/* What the Course Includes */}
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  What the Course Includes
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Our 1-day, classroom-based course combines theory and practical learning covering:
                </p>
                <ul className="space-y-2 ml-4">
                  {trainingDetails[selectedTrainingInfo.type].courseIncludes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  On completion, you'll receive your official NTDA REACT Licence, certifying you to operate at the roadside anywhere in the UK.
                </p>
              </div>

              {/* Who It's For */}
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Who It's For
                </h3>
                <p className="text-sm text-muted-foreground mb-3">This course is ideal for:</p>
                <ul className="space-y-2 ml-4">
                  {trainingDetails[selectedTrainingInfo.type].whoItsFor.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Duration & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" />
                      Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{trainingDetails[selectedTrainingInfo.type].durationInfo}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-accent" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{trainingDetails[selectedTrainingInfo.type].locationInfo}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Price & Certification */}
              <Card className="bg-accent/10 border-accent">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <PoundIcon className="w-6 h-6 text-accent" />
                    Course Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-accent mb-2">{formatPrice(selectedTrainingInfo.price)}</p>
                  <p className="text-sm text-muted-foreground">
                    Includes certification, course materials, and registration with NTDA
                  </p>
                </CardContent>
              </Card>

              {/* Action Button */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    handleToggleTraining(selectedTrainingInfo.id);
                    setSelectedTrainingInfo(null);
                  }}
                  className={`flex-1 ${isSelected(selectedTrainingInfo.id) ? 'bg-accent text-accent-foreground border-accent' : 'bg-transparent text-accent border-2 border-accent hover:bg-accent hover:text-accent-foreground'}`}
                  data-testid="button-select-from-dialog"
                >
                  {isSelected(selectedTrainingInfo.id) ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Selected
                    </>
                  ) : (
                    'Select This Training'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <ConfiguratorTutorial page="training" />
    </div>
  );
}
