import { useEffect, useState } from "react";
import logoPath from "@assets/Untitled design-51_1759240381746.png";

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('hasLoadedBefore');
    }
    return true;
  });
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Choose your van",
    "Choose your kit",
    "Choose your upgrades",
    "Choose your finance"
  ];

  useEffect(() => {
    if (!isVisible) return;

    sessionStorage.setItem('hasLoadedBefore', 'true');

    // Steps appear every 300ms — all 4 visible by 1.2s
    const stepTimers = steps.map((_, index) =>
      setTimeout(() => setActiveStep(index + 1), (index + 1) * 300)
    );

    // Hide after 1.8s instead of 3.2s
    const hideTimer = setTimeout(() => setIsVisible(false), 1800);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(hideTimer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-700"
      style={{ opacity: isVisible ? 1 : 0 }}
      data-testid="loading-screen"
    >
      <img
        src={logoPath}
        alt="Tyre Van City"
        className="w-48 h-48 md:w-64 md:h-64 mb-16 object-contain"
        data-testid="img-loading-logo"
      />

      <div className="flex flex-col items-center gap-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className="text-xl md:text-2xl font-semibold text-foreground transition-opacity duration-500"
            style={{ opacity: activeStep > index ? 1 : 0 }}
            data-testid={`text-loading-step-${index}`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
