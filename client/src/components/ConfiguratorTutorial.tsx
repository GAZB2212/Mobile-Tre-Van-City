import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface ConfiguratorTutorialProps {
  page: "van" | "kit" | "upgrades" | "finance" | "quote";
}

const tutorialSteps: Record<string, Step[]> = {
  van: [
    {
      target: "body",
      content: "Welcome to the van configurator! Let's walk through building your perfect mobile tyre van.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: "[data-testid='text-page-title']",
      content: "First, choose a base van from our available stock. Each van includes detailed specifications and pricing.",
      placement: "bottom",
    },
    {
      target: "[data-testid='card-van-0']",
      content: "Click on any van to view more details. You'll see the make, model, year, mileage, and full specifications.",
      placement: "top",
    },
    {
      target: "[data-testid='button-next']",
      content: "Once you've selected a van, click Next to choose your tyre equipment kit.",
      placement: "top",
    },
  ],
  kit: [
    {
      target: "[data-testid='text-page-title']",
      content: "Now choose a tyre equipment kit. Each kit includes different power ratings and equipment.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "[data-testid='card-kit-0']",
      content: "Review what's included in each kit, the power output, and pricing. Select the one that fits your business needs.",
      placement: "top",
    },
    {
      target: "[data-testid='button-next']",
      content: "After selecting your kit, move on to add optional upgrades and extras.",
      placement: "top",
    },
  ],
  upgrades: [
    {
      target: "[data-testid='text-page-title']",
      content: "Enhance your van with additional upgrades and equipment.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: ".grid.gap-3",
      content: "Browse through categories like air systems, equipment, branding, and comfort options. Select any items you need.",
      placement: "top",
    },
    {
      target: "[data-testid='summary-container']",
      content: "Your running total updates automatically as you add upgrades. Review your selections here anytime.",
      placement: "left",
    },
    {
      target: "[data-testid='button-next']",
      content: "When you're happy with your upgrades, continue to explore financing options.",
      placement: "top",
    },
  ],
  finance: [
    {
      target: "[data-testid='text-page-title']",
      content: "Choose how you'd like to finance your van conversion.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: ".grid.gap-6",
      content: "We offer Hire Purchase and Lease options. Compare monthly payments and terms to find what works for you.",
      placement: "top",
    },
    {
      target: "[data-testid='button-next']",
      content: "Ready to request a quote? Click Next to submit your configuration to our team.",
      placement: "top",
    },
  ],
  quote: [
    {
      target: "[data-testid='text-page-title']",
      content: "Almost done! Fill in your contact details to receive your custom quote.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "form",
      content: "Our team will review your configuration and send you a detailed quote via email. We'll be in touch soon!",
      placement: "top",
    },
  ],
};

export function ConfiguratorTutorial({ page }: ConfiguratorTutorialProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if user has seen tutorial for this page
    const tutorialCompleted = localStorage.getItem("configurator-tutorial-completed");
    const isFirstVisit = localStorage.getItem("configurator-first-visit") === null;

    // Only show tutorial on first ever visit to the configurator
    if (isFirstVisit && page === "van") {
      localStorage.setItem("configurator-first-visit", "false");
      setTimeout(() => setRun(true), 500); // Small delay for page to render
    }
  }, [page]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem("configurator-tutorial-completed", "true");
    }

    if (data.action === "next" || data.action === "prev") {
      setStepIndex(index + (data.action === "next" ? 1 : -1));
    }
  };

  const startTutorial = () => {
    setStepIndex(0);
    setRun(true);
  };

  const steps = tutorialSteps[page] || [];

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "hsl(var(--primary))",
            textColor: "hsl(var(--foreground))",
            backgroundColor: "hsl(var(--background))",
            arrowColor: "hsl(var(--background))",
            overlayColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: "var(--radius)",
            fontSize: "0.875rem",
          },
          buttonNext: {
            backgroundColor: "hsl(var(--primary))",
            borderRadius: "var(--radius)",
            fontSize: "0.875rem",
            padding: "0.5rem 1rem",
          },
          buttonBack: {
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.875rem",
          },
          buttonSkip: {
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.875rem",
          },
        }}
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip tour",
        }}
      />

      {/* Help button to restart tutorial */}
      <Button
        onClick={startTutorial}
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        data-testid="button-tutorial-help"
        title="Start tutorial"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    </>
  );
}
