import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Cookie Policy"
        description="Cookie policy for Mobile Tyre Van City — how GAJO Creative Ltd uses cookies and similar technologies across the platform."
        canonical="/cookie-policy"
        noindex={true}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <Card data-testid="card-cookie-policy">
          <CardHeader>
            <CardTitle className="text-4xl">Cookie Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-invert max-w-none">

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-introduction">1. Introduction</h2>
              <p>
                This Cookie Policy explains how GAJO Creative Ltd ("GAJO", "we", "our", or "us") uses cookies and similar technologies across websites, platforms, configurator systems, customer portals, automation systems, and associated digital infrastructure operated by GAJO ("Platform").
              </p>
              <p className="mt-3">
                GAJO owns, develops, operates, and maintains the Platform and associated Digital Assets used in connection with various commercial operations and services.
              </p>
              <p className="mt-3">
                By continuing to use the Platform, you consent to the use of cookies in accordance with this Cookie Policy, subject to your browser and consent preferences.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-what-are">2. What Are Cookies</h2>
              <p>Cookies are small text files stored on your device when you visit a website or use online services.</p>
              <p className="mt-3">
                Cookies help platforms function correctly, improve user experience, remember preferences, analyse traffic, maintain security, and support operational functionality.
              </p>
              <p className="mt-3">Cookies may be:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>First-party cookies</strong> — set directly by GAJO systems</li>
                <li><strong>Third-party cookies</strong> — set by integrated third-party services or providers</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-types">3. Types of Cookies We Use</h2>

              <div className="space-y-6">
                <div>
                  <p className="font-semibold text-lg">Essential Cookies</p>
                  <p className="text-muted-foreground mt-1">
                    These cookies are necessary for operation of the Platform and cannot be disabled through our systems.
                  </p>
                  <p className="mt-2">They may be used for:</p>
                  <ul className="list-disc pl-6 mt-1 space-y-1 text-sm">
                    <li>Security and authentication</li>
                    <li>Session management</li>
                    <li>Fraud prevention</li>
                    <li>Platform stability</li>
                    <li>Load balancing</li>
                    <li>Form submissions</li>
                    <li>Cookie preference storage</li>
                    <li>User authentication</li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">Without these cookies, parts of the Platform may not function correctly.</p>
                </div>

                <div>
                  <p className="font-semibold text-lg">Functional Cookies</p>
                  <p className="text-muted-foreground mt-1">
                    These cookies improve functionality and user experience by remembering preferences and temporary information.
                  </p>
                  <p className="mt-2">They may be used for:</p>
                  <ul className="list-disc pl-6 mt-1 space-y-1 text-sm">
                    <li>Saving configurator progress</li>
                    <li>Retaining user preferences</li>
                    <li>Form state persistence</li>
                    <li>Interface customisation</li>
                    <li>Temporary session data</li>
                    <li>Workflow continuity</li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">Disabling these cookies may reduce Platform functionality.</p>
                </div>

                <div>
                  <p className="font-semibold text-lg">Analytics Cookies</p>
                  <p className="text-muted-foreground mt-1">
                    Analytics cookies help us understand how users interact with the Platform so we can improve usability, stability, performance, and customer experience.
                  </p>
                  <p className="mt-2">Analytics data may include:</p>
                  <ul className="list-disc pl-6 mt-1 space-y-1 text-sm">
                    <li>Pages visited</li>
                    <li>Navigation behaviour</li>
                    <li>Time spent on pages</li>
                    <li>Device and browser information</li>
                    <li>Session interactions</li>
                    <li>Error diagnostics</li>
                    <li>Performance metrics</li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">Where possible, analytics data is aggregated or anonymised.</p>
                </div>

                <div>
                  <p className="font-semibold text-lg">Marketing &amp; Advertising Cookies</p>
                  <p className="text-muted-foreground mt-1">These cookies may be used to:</p>
                  <ul className="list-disc pl-6 mt-1 space-y-1 text-sm">
                    <li>Deliver relevant advertising</li>
                    <li>Measure campaign performance</li>
                    <li>Enable remarketing campaigns</li>
                    <li>Track conversion activity</li>
                    <li>Build audience insights</li>
                    <li>Improve marketing effectiveness</li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Third-party advertising and analytics providers may place cookies on the Platform. Disabling these cookies may affect advertising relevance.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-specific">4. Cookies &amp; Technologies Used</h2>
              <p className="mb-4 text-muted-foreground">The Platform may utilise technologies including but not limited to:</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Cookie / Technology</th>
                      <th className="text-left p-2 font-semibold">Purpose</th>
                      <th className="text-left p-2 font-semibold">Type</th>
                      <th className="text-left p-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-mono">cookie_consent</td>
                      <td className="p-2">Stores cookie preferences</td>
                      <td className="p-2">Essential</td>
                      <td className="p-2">Up to 1 year</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">session_id</td>
                      <td className="p-2">Maintains session state</td>
                      <td className="p-2">Essential</td>
                      <td className="p-2">Session</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">configurator_state</td>
                      <td className="p-2">Saves temporary configurator progress</td>
                      <td className="p-2">Functional</td>
                      <td className="p-2">Up to 30 days</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">auth_token</td>
                      <td className="p-2">User authentication and security</td>
                      <td className="p-2">Essential</td>
                      <td className="p-2">Session</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">_ga / _gid</td>
                      <td className="p-2">Google Analytics tracking</td>
                      <td className="p-2">Analytics</td>
                      <td className="p-2">Up to 2 years</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Meta Pixel</td>
                      <td className="p-2">Advertising and remarketing</td>
                      <td className="p-2">Marketing</td>
                      <td className="p-2">Up to 2 years</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Local Storage</td>
                      <td className="p-2">Temporary application state</td>
                      <td className="p-2">Functional</td>
                      <td className="p-2">Varies</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">API Session Tokens</td>
                      <td className="p-2">Platform communication and security</td>
                      <td className="p-2">Essential</td>
                      <td className="p-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Actual technologies used may vary as the Platform evolves.</p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-third-party">5. Third-Party Services</h2>
              <p>
                GAJO may utilise third-party providers for analytics, hosting, communications, automation, AI systems, embedded functionality, advertising, and infrastructure services.
              </p>
              <p className="mt-3">
                These providers may place cookies or similar technologies subject to their own privacy policies. Examples may include:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Privacy Policy</a>
                </li>
                <li>
                  <a href="https://www.facebook.com/privacy/policy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Meta Privacy Policy</a>
                </li>
                <li>
                  <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Privacy Policy</a>
                </li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                GAJO does not directly control third-party cookies once deployed by external providers.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-manage">6. Managing Cookies</h2>

              <p className="font-semibold">Cookie Consent Preferences</p>
              <p className="mt-1">
                Where legally required, the Platform may display a cookie consent mechanism allowing users to manage non-essential cookies. Users may update preferences where functionality is available.
              </p>

              <p className="font-semibold mt-4">Browser Controls</p>
              <p className="mt-1">Most browsers allow users to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>View stored cookies</li>
                <li>Delete cookies</li>
                <li>Block cookies</li>
                <li>Restrict third-party cookies</li>
                <li>Automatically clear cookies on exit</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Disabling cookies may impact Platform functionality and user experience.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-data-protection">7. Data Protection</h2>
              <p>
                Information collected through cookies may constitute personal data under applicable data protection laws.
              </p>
              <p className="mt-3">
                For information regarding how personal data is processed, stored, and protected, please refer to the{" "}
                <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-updates">8. Changes to This Policy</h2>
              <p>GAJO reserves the right to amend this Cookie Policy at any time.</p>
              <p className="mt-2">Updated versions become effective immediately upon publication on the Platform.</p>
              <p className="mt-2">Continued use of the Platform constitutes acceptance of any revised policy.</p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-contact">9. Contact Information</h2>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>GAJO Creative Ltd</strong></p>
                <p>United Kingdom</p>
                <p className="mt-2">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:hello@gajocreative.co.uk" className="text-primary hover:underline">hello@gajocreative.co.uk</a>
                </p>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
