import { useConfigurator } from "@/lib/ConfiguratorContext";

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
  return [
    ...BASE_STEPS,
    ...(isCommercial ? [] : [KIT_STEP]),
    ...LATER_STEPS,
  ];
}

interface ConfiguratorStepperProps {
  currentPath: string;
}

export default function ConfiguratorStepper({ currentPath }: ConfiguratorStepperProps) {
  const steps = useConfiguratorSteps();
  const totalSteps = steps.length;
  const currentIndex = steps.findIndex(s => s.path === currentPath);

  if (currentIndex < 0) return null;

  const currentStep = currentIndex + 1;
  const pct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="mb-6" data-testid="configurator-stepper">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" data-testid="text-step-indicator">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-medium text-foreground">
          {steps[currentIndex]?.title}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-accent h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
          data-testid="progress-bar"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        />
      </div>
    </div>
  );
}
