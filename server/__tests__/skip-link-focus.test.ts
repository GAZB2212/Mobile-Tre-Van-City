import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";

// vi.mock is hoisted before all imports by vitest, so every mock below is
// active when AdminLayout, FinancePortal, and PublicMain are first imported.

vi.mock("wouter", () => ({
  // wouter returns [pathname, navigate] — both must be present.
  useLocation: vi.fn(() => ["/", vi.fn()]),
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    createElement("a", { href, ...rest }, children),
}));

// AdminLayout uses Tooltip which Radix wires to a context set by TooltipProvider.
// Replacing the primitives with neutral wrappers avoids the missing-context error
// while keeping the component tree intact for layout assertions.
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  TooltipContent: ({ children }: { children: React.ReactNode }) => createElement("span", null, children),
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    // adminRole:"finance" satisfies FinancePortal's guard at line 172.
    user: { id: 1, username: "finance", role: "finance", adminRole: "finance", name: "Finance User" },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined, isLoading: false, error: null }),
  useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
  clearAuthToken: vi.fn(),
  queryClient: { invalidateQueries: vi.fn(), setQueryData: vi.fn() },
}));

vi.mock("@/hooks/useEnquiryNotifications", () => ({
  useEnquiryNotifications: () => ({ unreadCount: 0, isSnoozed: false, snoozeUntil: null }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn(), dismiss: vi.fn(), toasts: [] }),
}));

// PNG assets cannot be handled in jsdom — stub as empty strings.
vi.mock("@assets/Untitled_design-36_1773155683674.png", () => ({ default: "" }));
vi.mock("@assets/Untitled design-47_1759231860895.png", () => ({ default: "" }));

// These components carry deep import trees of their own; stub to keep the
// test focused on layout structure rather than descendant behaviour.
vi.mock("@/components/AdminProfileModal", () => ({ AdminProfileModal: () => null }));
vi.mock("@/components/AdminHelpWidget", () => ({ AdminHelpWidget: () => null }));

// ── imports (all resolved against the mocks above) ────────────────────────────
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import SkipLink from "@/components/SkipLink";
import { PublicMain } from "@/lib/PublicMain";
import { AdminLayout } from "@/components/AdminLayout";
import FinancePortal from "@/pages/FinancePortal";

// ── helpers ────────────────────────────────────────────────────────────────────
function parse(html: string): Document {
  return new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`).window.document;
}

function tabIndexOf(el: Element): number {
  const v = el.getAttribute("tabindex");
  return v === null ? 0 : parseInt(v, 10);
}

function renderPage(...nodes: React.ReactNode[]): Document {
  return parse(renderToStaticMarkup(createElement("div", null, ...nodes)));
}

// ── Route: / ─────────────────────────────────────────────────────────────────
describe("route /  —  SkipLink + PublicMain", () => {
  it("renders exactly one #main-content", () => {
    vi.mocked(useLocation).mockReturnValue(["/"]);
    const doc = renderPage(
      createElement(SkipLink),
      createElement(PublicMain, null, createElement("h1", null, "Home")),
    );
    expect(doc.querySelectorAll("#main-content")).toHaveLength(1);
  });

  it("#main-content has tabIndex=-1", () => {
    vi.mocked(useLocation).mockReturnValue(["/"]);
    const doc = renderPage(
      createElement(PublicMain, null, createElement("p", null, "body")),
    );
    const main = doc.querySelector("#main-content")!;
    expect(main).not.toBeNull();
    expect(tabIndexOf(main)).toBe(-1);
  });

  it("skip link href resolves to the focusable #main-content target", () => {
    vi.mocked(useLocation).mockReturnValue(["/"]);
    const doc = renderPage(
      createElement(SkipLink),
      createElement(PublicMain, null, createElement("p", null, "body")),
    );
    const link = doc.querySelector<HTMLAnchorElement>('a[href="#main-content"]');
    expect(link).not.toBeNull();
    const target = doc.getElementById("main-content");
    expect(target).not.toBeNull();
    expect(tabIndexOf(target!)).toBe(-1);
  });

  it("PublicMain yields no #main-content for /admin/* (prevents duplicate IDs)", () => {
    vi.mocked(useLocation).mockReturnValue(["/admin/quotes"]);
    const doc = renderPage(
      createElement(PublicMain, null, createElement("div", null, "admin page")),
    );
    expect(doc.querySelectorAll("#main-content")).toHaveLength(0);
  });

  it("PublicMain yields no #main-content for /finance-portal (prevents duplicate IDs)", () => {
    vi.mocked(useLocation).mockReturnValue(["/finance-portal"]);
    const doc = renderPage(
      createElement(PublicMain, null, createElement("div", null, "finance page")),
    );
    expect(doc.querySelectorAll("#main-content")).toHaveLength(0);
  });
});

// ── Route: /admin/quotes  —  AdminLayout owns #main-content ──────────────────
describe("route /admin/quotes  —  AdminLayout owns #main-content", () => {
  it("renders exactly one #main-content", () => {
    vi.mocked(useLocation).mockReturnValue(["/admin/quotes"]);
    // PublicMain passes children straight through for admin paths, so the
    // only #main-content comes from AdminLayout itself.
    const doc = renderPage(
      createElement(SkipLink),
      createElement(PublicMain, null,
        createElement(AdminLayout, null, createElement("div", null, "dashboard")),
      ),
    );
    expect(doc.querySelectorAll("#main-content")).toHaveLength(1);
  });

  it("#main-content has tabIndex=-1", () => {
    vi.mocked(useLocation).mockReturnValue(["/admin/quotes"]);
    const doc = renderPage(
      createElement(AdminLayout, null, createElement("div", null, "dashboard")),
    );
    const main = doc.querySelector("#main-content")!;
    expect(main).not.toBeNull();
    expect(tabIndexOf(main)).toBe(-1);
  });

  it("skip link href resolves to the focusable #main-content target", () => {
    vi.mocked(useLocation).mockReturnValue(["/admin/quotes"]);
    const doc = renderPage(
      createElement(SkipLink),
      createElement(AdminLayout, null, createElement("div", null, "dashboard")),
    );
    const link = doc.querySelector<HTMLAnchorElement>('a[href="#main-content"]');
    expect(link).not.toBeNull();
    const target = doc.getElementById("main-content");
    expect(target).not.toBeNull();
    expect(tabIndexOf(target!)).toBe(-1);
  });
});

// ── Route: /finance-portal  —  FinancePortal owns #main-content ──────────────
describe("route /finance-portal  —  FinancePortal owns #main-content", () => {
  it("renders exactly one #main-content", () => {
    vi.mocked(useLocation).mockReturnValue(["/finance-portal"]);
    const doc = renderPage(
      createElement(SkipLink),
      createElement(PublicMain, null,
        createElement(FinancePortal),
      ),
    );
    expect(doc.querySelectorAll("#main-content")).toHaveLength(1);
  });

  it("#main-content has tabIndex=-1", () => {
    vi.mocked(useLocation).mockReturnValue(["/finance-portal"]);
    const doc = renderPage(createElement(FinancePortal));
    const main = doc.querySelector("#main-content")!;
    expect(main).not.toBeNull();
    expect(tabIndexOf(main)).toBe(-1);
  });

  it("skip link href resolves to the focusable #main-content target", () => {
    vi.mocked(useLocation).mockReturnValue(["/finance-portal"]);
    const doc = renderPage(
      createElement(SkipLink),
      createElement(FinancePortal),
    );
    const link = doc.querySelector<HTMLAnchorElement>('a[href="#main-content"]');
    expect(link).not.toBeNull();
    const target = doc.getElementById("main-content");
    expect(target).not.toBeNull();
    expect(tabIndexOf(target!)).toBe(-1);
  });
});
