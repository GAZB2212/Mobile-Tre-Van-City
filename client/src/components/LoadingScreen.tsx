import { useEffect, useRef, useState } from "react";
import logoPath from "@assets/Untitled design-51_1759240381746.png";

const DEFAULT_HERO_VIDEO = "/media/website_hero_1772966773377.mp4";

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('hasLoadedBefore');
    }
    return true;
  });
  const [activeStep, setActiveStep] = useState(0);
  const [heroVideoUrl, setHeroVideoUrl] = useState(DEFAULT_HERO_VIDEO);
  const preloadVideoRef = useRef<HTMLVideoElement>(null);

  const steps = [
    "Choose your van",
    "Choose your kit",
    "Choose your upgrades",
    "Choose your finance"
  ];

  // Fetch the real hero video URL from settings as early as possible
  useEffect(() => {
    fetch("/api/site-settings")
      .then(r => r.json())
      .then((s: Record<string, string>) => {
        const url = s?.hero_video_url ?? DEFAULT_HERO_VIDEO;
        setHeroVideoUrl(url);
      })
      .catch(() => {});
  }, []);

  // Once we have the URL, imperatively start buffering it
  useEffect(() => {
    const video = preloadVideoRef.current;
    if (!video || !heroVideoUrl) return;
    video.muted = true;
    video.src = heroVideoUrl;
    video.load();
    video.play().catch(() => {});
  }, [heroVideoUrl]);

  useEffect(() => {
    if (!isVisible) return;

    sessionStorage.setItem('hasLoadedBefore', 'true');

    const stepTimers = steps.map((_, index) =>
      setTimeout(() => setActiveStep(index + 1), (index + 1) * 300)
    );

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
      {/* Hidden video that buffers the hero video while splash is showing */}
      <video
        ref={preloadVideoRef}
        muted
        playsInline
        preload="auto"
        style={{ position: "fixed", opacity: 0, pointerEvents: "none", width: 1, height: 1, top: 0, left: 0 }}
        aria-hidden="true"
      />

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
