import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
}

interface ConfiguratorStepperProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export default function ConfiguratorStepper({ currentStep, onStepChange }: ConfiguratorStepperProps) {
  const steps: Step[] = [
    {
      id: 1,
      title: "Base Van",
      description: "Choose your vehicle or use existing stock",
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending'
    },
    {
      id: 2,
      title: "Tyre Kit",
      description: "Select your equipment package",
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending'
    },
    {
      id: 3,
      title: "Upgrades",
      description: "Add extras and customizations",
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending'
    },
    {
      id: 4,
      title: "Summary",
      description: "Review and request quote",
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'pending'
    }
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Van Configuration Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div 
                className={`flex items-center cursor-pointer ${
                  step.status === 'pending' ? 'opacity-50' : 'hover-elevate'
                }`}
                onClick={() => step.status !== 'pending' && onStepChange(step.id)}
                data-testid={`step-${step.id}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step.status === 'completed' 
                    ? 'bg-chart-3 border-chart-3' 
                    : step.status === 'current' 
                      ? 'border-chart-2 bg-chart-2 text-white' 
                      : 'border-muted bg-background'
                }`}>
                  {step.status === 'completed' ? (
                    <Check className="w-5 h-5 text-black" />
                  ) : (
                    <span className={`font-semibold ${
                      step.status === 'current' ? 'text-white' : 'text-muted-foreground'
                    }`}>
                      {step.id}
                    </span>
                  )}
                </div>
                
                <div className="ml-3">
                  <div className={`font-semibold ${
                    step.status === 'current' ? 'text-foreground' : 
                    step.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-muted-foreground mx-4 hidden md:block" />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <Badge variant={currentStep === 4 ? "default" : "secondary"} className="bg-chart-3 text-black">
            Step {currentStep} of {steps.length}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}