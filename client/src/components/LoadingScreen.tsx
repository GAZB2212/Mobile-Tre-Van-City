import { useEffect, useState } from "react";
import logoPath from "@assets/logo_17_1770396630370.png";

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

    const stepTimers = steps.map((_, index) => {
      return setTimeout(() => {
        setActiveStep(index + 1);
      }, (index + 1) * 500);
    });

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3200);

    return () => {
      stepTimers.forEach(timer => clearTimeout(timer));
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
        alt="Northwest Van Conversions" 
        className="w-48 h-48 md:w-64 md:h-64 mb-16 object-contain"
        data-testid="img-loading-logo"
      />
      
      <div className="flex flex-col items-center gap-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className="text-xl md:text-2xl font-semibold text-foreground transition-opacity duration-1000"
            style={{
              opacity: activeStep > index ? 1 : 0
            }}
            data-testid={`text-loading-step-${index}`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
