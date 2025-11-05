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
      target: "[data-testid='grid-vans']",
      content: "Browse through our available vans. Click on any van to view more details including make, model, year, mileage, and full specifications.",
      placement: "top",
    },
    {
      target: "[data-testid='summary-container']",
      content: "Your configuration summary shows here. As you make selections, you'll see the running total and what's included.",
      placement: "left",
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
      target: "[data-testid='grid-kits']",
      content: "Review what's included in each kit, the power output, and pricing. Select the one that fits your business needs.",
      placement: "top",
    },
    {
      target: "[data-testid='summary-container']",
      content: "Your running total updates automatically as you select a kit. See what's included in your current selection.",
      placement: "left",
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
      target: "[data-testid='section-upgrades']",
      content: "Browse through categories like air systems, equipment, branding, and comfort options. Select any items you need.",
      placement: "top",
    },
    {
      target: "[data-testid='summary-container']",
      content: "Your running total updates automatically as you add upgrades. Review your selections here anytime.",
      placement: "left",
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
      target: "[data-testid='summary-container']",
      content: "Review your total cost and explore financing options. See your final configuration before requesting a quote.",
      placement: "left",
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

  useEffect(() => {
    // Check if user has seen tutorial for this page
    const isFirstVisit = localStorage.getItem("configurator-first-visit") === null;

    // Only show tutorial on first ever visit to the configurator
    if (isFirstVisit && page === "van") {
      localStorage.setItem("configurator-first-visit", "false");
      
      // Wait for all target elements to exist before starting
      const waitForElements = () => {
        const steps = tutorialSteps[page] || [];
        const allTargetsExist = steps.every(step => {
          // Skip "body" target as it always exists
          if (step.target === "body") return true;
          // Check if element exists
          return document.querySelector(step.target as string) !== null;
        });

        if (allTargetsExist) {
          setRun(true);
        } else {
          // Keep checking every 100ms until elements load
          setTimeout(waitForElements, 100);
        }
      };

      // Start checking after initial delay for page render
      setTimeout(waitForElements, 300);
    }
  }, [page]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    console.log("Joyride callback:", data);

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem("configurator-tutorial-completed", "true");
    }
  };

  const startTutorial = () => {
    // Wait for all target elements to exist before starting
    const waitForElements = () => {
      const steps = tutorialSteps[page] || [];
      const allTargetsExist = steps.every(step => {
        // Skip "body" target as it always exists
        if (step.target === "body") return true;
        // Check if element exists
        return document.querySelector(step.target as string) !== null;
      });

      if (allTargetsExist) {
        setRun(true);
      } else {
        // Keep checking every 100ms until elements load
        setTimeout(waitForElements, 100);
      }
    };

    // Start checking immediately when manually triggered
    waitForElements();
  };

  const steps = tutorialSteps[page] || [];

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
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
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 z-[9999] h-12 w-12 rounded-full shadow-lg bg-accent hover:bg-accent/90"
        data-testid="button-tutorial-help"
        title="Start tutorial"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    </>
  );
}
