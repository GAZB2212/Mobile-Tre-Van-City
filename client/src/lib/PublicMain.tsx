import { type ReactNode } from "react";
import { useLocation } from "wouter";

/**
 * Wraps all public (non-admin, non-finance-portal) routes in a labelled
 * <main id="main-content"> landmark so the global SkipLink target is always
 * present. AdminLayout and FinancePortal each manage their own landmark and
 * are excluded here to prevent duplicate IDs in the DOM.
 *
 * Kept as a separate module (rather than inlined in App.tsx) so it can be
 * imported and tested in isolation without pulling in the full app bundle.
 */
export function PublicMain({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isExcluded =
    location.startsWith("/admin") || location.startsWith("/finance-portal");
  if (isExcluded) return <>{children}</>;
  return (
    <main id="main-content" tabIndex={-1} className="outline-none">
      {children}
    </main>
  );
}
