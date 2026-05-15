import { test, expect, type Page } from "@playwright/test";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

const FINANCE_USERNAME = "e2e-finance";
const FINANCE_PASSWORD = "e2eFinance99!";

/**
 * Log in via the REST endpoint, retrieve the bearer token from the JSON
 * response, and store it in localStorage so that subsequent page navigation
 * is authenticated exactly as it would be in the real browser.
 *
 * The page must already have navigated to the origin once before this is
 * called so that localStorage is bound to the correct domain.
 */
async function loginAndStoreToken(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  const res = await page.request.post("/api/auth/login", {
    data: { username, password },
  });
  expect(res.ok(), `Login failed for ${username}: ${res.status()}`).toBe(true);
  const body = await res.json();
  const token: string = body._authToken;
  expect(token, "Login response must contain _authToken").toBeTruthy();

  // Persist the token in localStorage exactly as the app does on login.
  await page.evaluate((t) => localStorage.setItem("_authToken", t), token);
}

/**
 * Press Tab once (from the very beginning of the document) to reach the skip
 * link, assert it received focus, then press Enter to activate it.
 *
 * Pressing Escape first closes any overlay that might be trapping focus
 * (e.g. cookie consent). Blurring the active element before Tab ensures the
 * traversal starts from the top of the DOM.
 */
async function tabToSkipLinkAndActivate(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur?.());

  await page.keyboard.press("Tab");

  const skipLink = page.locator('[data-testid="link-skip-to-main"]');
  await expect(skipLink).toBeFocused({ timeout: 5_000 });

  await page.keyboard.press("Enter");
}

/**
 * Returns true when document.activeElement is exactly the #main-content element.
 */
async function isMainContentFocused(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.getElementById("main-content");
    return el !== null && document.activeElement === el;
  });
}

test.describe("Skip link — keyboard focus reaches #main-content", () => {
  /**
   * Create the finance test user once before any test runs. The dev-only
   * endpoint is idempotent — it updates the user if the username already exists.
   */
  test.beforeAll(async ({ request }) => {
    const res = await request.post("/api/dev/create-test-user", {
      data: {
        username: FINANCE_USERNAME,
        password: FINANCE_PASSWORD,
        adminRole: "finance",
      },
    });
    expect(
      res.ok(),
      `Could not create finance test user: ${res.status()} ${await res.text()}`
    ).toBe(true);
  });

  // ── Test 1: Public home page ────────────────────────────────────────────────
  test("/ — Tab then Enter moves focus to #main-content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await tabToSkipLinkAndActivate(page);

    expect(await isMainContentFocused(page)).toBe(true);
  });

  // ── Test 2: Admin page ──────────────────────────────────────────────────────
  test("/admin/quotes — Tab then Enter moves focus to #main-content", async ({
    page,
  }) => {
    // Navigate first so localStorage is scoped to the correct origin.
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await loginAndStoreToken(page, ADMIN_USERNAME, ADMIN_PASSWORD);

    await page.goto("/admin/quotes");
    await page.waitForLoadState("networkidle");

    await tabToSkipLinkAndActivate(page);

    expect(await isMainContentFocused(page)).toBe(true);
  });

  // ── Test 3: Finance portal ──────────────────────────────────────────────────
  // Skipped: finance-role e2e login returns 401 in CI — tracked as task #426
  test.skip("/finance-portal — Tab then Enter moves focus to #main-content", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await loginAndStoreToken(page, FINANCE_USERNAME, FINANCE_PASSWORD);

    await page.goto("/finance-portal");
    await page.waitForLoadState("networkidle");

    await tabToSkipLinkAndActivate(page);

    expect(await isMainContentFocused(page)).toBe(true);
  });
});
