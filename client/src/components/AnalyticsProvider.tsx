import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { initSession, trackPageview, markSessionAsAdmin } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const initialized = useRef(false);
  const lastLocation = useRef<string>("");
  const adminMarked = useRef(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const init = async () => {
      await initSession();
      initialized.current = true;
    };
    init();
  }, []);

  // When an admin is detected, mark their analytics session so it gets filtered out
  useEffect(() => {
    if (isAuthenticated && !adminMarked.current) {
      adminMarked.current = true;
      markSessionAsAdmin();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (location === lastLocation.current) return;
    lastLocation.current = location;

    const firePageview = async () => {
      if (!initialized.current) {
        await initSession();
        initialized.current = true;
      }
      const fullUrl = location + window.location.search;
      await trackPageview(fullUrl, document.title);
    };

    // Small delay so document.title has time to update via SEO component
    const t = setTimeout(firePageview, 300);
    return () => clearTimeout(t);
  }, [location]);

  return <>{children}</>;
}
