import { useState } from "react";
import { useLocation } from "wouter";

export default function SkipLink() {
  const [location] = useLocation();
  const [focused, setFocused] = useState(false);

  if (location === "/login") return null;

  // CSS :focus alone won't reveal this link on touch devices because
  // pointer interactions don't trigger the :focus pseudo-class in the same
  // way keyboard navigation does. Mobile screen readers (VoiceOver, TalkBack)
  // DO fire JavaScript focus events when they move to an element, so we use
  // onFocus/onBlur state to control visibility instead. This makes the link
  // discoverable for all assistive-technology users regardless of input modality
  // while keeping it invisible to sighted pointer users who never focus it.
  return (
    <a
      href="#main-content"
      data-testid="link-skip-to-main"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={
        focused
          ? "fixed top-2 left-2 z-[9999] px-4 py-2 rounded-md bg-[#8bc440] text-[#191919] font-semibold text-sm shadow-lg outline-none"
          : "sr-only"
      }
    >
      Skip to main content
    </a>
  );
}
