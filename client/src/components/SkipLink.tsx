import { useLocation } from "wouter";

export default function SkipLink() {
  const [location] = useLocation();
  const hasTarget = location !== "/login";
  if (!hasTarget) return null;

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-md focus:bg-[#8bc440] focus:text-[#191919] focus:font-semibold focus:text-sm focus:shadow-lg focus:outline-none"
      data-testid="link-skip-to-main"
    >
      Skip to main content
    </a>
  );
}
