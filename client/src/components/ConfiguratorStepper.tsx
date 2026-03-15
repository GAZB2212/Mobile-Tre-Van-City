import { useLocation } from "wouter";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface Step {
  title: string;
  path: string;
}

const BASE_STEPS: Step[] = [
  { title: "Van", path: "/configurator/van" },
  { title: "Service Type", path: "/configurator/service-type" },
];

const KIT_STEP: Step = { title: "Kit", path: "/configurator/kit" };

const LATER_STEPS: Step[] = [
  { title: "Upgrades", path: "/configurator/upgrades" },
  { title: "Finance", path: "/configurator/finance" },
  { title: "Quote", path: "/configurator/quote" },
];

function useConfiguratorSteps() {
  const { state } = useConfigurator();
  const isCommercial = state.serviceType === "commercial";

  const steps = [
    ...BASE_STEPS,
    ...(isCommercial ? [] : [KIT_STEP]),
    ...LATER_STEPS,
  ];

  return steps;
}

interface ConfiguratorStepperProps {
  currentPath: string;
}

export default function ConfiguratorStepper({ currentPath }: ConfiguratorStepperProps) {
  const [, setLocation] = useLocation();
  const steps = useConfiguratorSteps();
  const totalSteps = steps.length;
  const currentIndex = steps.findIndex(s => s.path === currentPath);

  if (currentIndex < 0) return null;

  const currentStep = currentIndex + 1;

  return (
    <Card className="mb-6">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
          <p className="text-sm font-semibold text-foreground" data-testid="text-step-indicator">
            Step {currentStep} of {totalSteps}
          </p>
          <p className="text-sm text-muted-foreground">
            {steps[currentIndex]?.title}
          </p>
        </div>

        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            data-testid="progress-bar"
          />
        </div>

        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNum = index + 1;
            const status = currentStep > stepNum ? 'completed' : currentStep === stepNum ? 'current' : 'pending';
            const isClickable = status === 'completed' || status === 'current';

            return (
              <div key={step.path} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  className={`flex flex-col items-center gap-1 group ${
                    isClickable ? 'cursor-pointer' : 'cursor-default opacity-50'
                  }`}
                  onClick={() => isClickable && setLocation(step.path)}
                  disabled={!isClickable}
                  data-testid={`step-${stepNum}`}
                  aria-label={`${step.title} - Step ${stepNum} of ${totalSteps}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold transition-colors ${
                    status === 'completed'
                      ? 'bg-accent border-accent text-accent-foreground'
                      : status === 'current'
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-muted-foreground/30 bg-background text-muted-foreground'
                  }`}>
                    {status === 'completed' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span className={`text-xs hidden md:block text-center leading-tight ${
                    status === 'current' ? 'font-semibold text-foreground' :
                    status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </button>

                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${
                    currentStep > stepNum ? 'bg-accent' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}