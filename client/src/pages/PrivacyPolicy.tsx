import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy"
        description="Privacy policy for Mobile Tyre Van City — how we collect, use, and protect your personal data in compliance with UK GDPR."
        canonical="/privacy-policy"
        noindex={true}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <Card data-testid="card-privacy-policy">
          <CardHeader>
            <CardTitle className="text-4xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-invert max-w-none">
            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-introduction">1. Introduction</h2>
              <p>
                This website platform, configurator system, customer management infrastructure, automation systems, and associated digital technologies are owned, developed, operated, and maintained by GAJO Creative Ltd ("GAJO").
              </p>
              <p className="mt-3">
                The website is utilised by Mobile Tyre Van Conversions in connection with its commercial operations and customer services.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-information">2. Information We Collect</h2>
              <p>We may collect and process the following information:</p>

              <p className="font-semibold mt-4">Information You Voluntarily Provide</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Name</li>
                <li>Email address</li>
                <li>Telephone number</li>
                <li>Company information</li>
                <li>Vehicle and conversion requirements</li>
                <li>Finance enquiry details</li>
                <li>Uploaded documents or images</li>
                <li>Communications submitted through forms, email, chat systems, or telephone</li>
              </ul>

              <p className="font-semibold mt-4">Automatically Collected Information</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>IP address</li>
                <li>Browser and device information</li>
                <li>Operating system</li>
                <li>Usage analytics</li>
                <li>Session and cookie data</li>
                <li>Pages visited and interaction data</li>
                <li>Referral sources</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-usage">3. How We Use Your Information</h2>
              <p>We use information to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Process enquiries and quotations</li>
                <li>Operate and improve the platform</li>
                <li>Provide customer support</li>
                <li>Manage projects and communications</li>
                <li>Facilitate finance enquiries</li>
                <li>Improve functionality and performance</li>
                <li>Conduct analytics and diagnostics</li>
                <li>Prevent fraud, abuse, or unauthorised activity</li>
                <li>Comply with legal and regulatory obligations</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-lawful-basis">4. Lawful Basis for Processing</h2>
              <p>We process personal information under the following lawful bases:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Contractual necessity</li>
                <li>Legitimate business interests</li>
                <li>Consent</li>
                <li>Legal obligations</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-infrastructure">5. Platform Infrastructure &amp; Digital Systems</h2>
              <p>
                The website platform, configurator systems, customer relationship management systems, databases, automation tools, APIs, AI systems, enquiry handling systems, workflows, and associated digital infrastructure are proprietary systems owned exclusively by GAJO Creative Ltd.
              </p>
              <p className="mt-3">
                The Operating Business is granted limited licensed access to use the platform for commercial operations. No ownership rights or intellectual property rights are transferred by virtue of such use.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-sharing">6. Information Sharing</h2>
              <p>We do not sell personal information.</p>
              <p className="mt-3">Information may be shared with:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Finance providers</li>
                <li>Payment processors</li>
                <li>Hosting providers</li>
                <li>CRM and communications providers</li>
                <li>Analytics providers</li>
                <li>Professional advisers</li>
                <li>Legal or regulatory authorities where required</li>
              </ul>
              <p className="mt-3">All third parties are required to process information securely and lawfully.</p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-cookies">7. Cookies &amp; Tracking</h2>
              <p>
                We use cookies and similar technologies to operate and improve the platform.
              </p>
              <p className="mt-3">
                Users may manage cookie preferences through browser settings and applicable consent tools.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-retention">8. Data Retention</h2>
              <p>
                Information is retained only as long as reasonably necessary for operational, legal, contractual, and regulatory purposes.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-security">9. Data Security</h2>
              <p>
                We implement reasonable technical and organisational security measures to protect information and platform integrity.
              </p>
              <p className="mt-3">
                However, no internet-based system can be guaranteed completely secure.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-rights">10. Your Rights</h2>
              <p>Under UK GDPR, users may request:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Access to personal data</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of personal data</li>
                <li>Restriction of processing</li>
                <li>Objection to processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent</li>
              </ul>
              <p className="mt-3">Requests may be submitted using the contact details below.</p>
              <p className="mt-3">
                Users also have the right to complain to the UK Information Commissioner's Office: <strong>ICO</strong>
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-third-party">11. Third-Party Services</h2>
              <p>
                The platform may contain links or integrations with third-party services. GAJO is not responsible for external websites or services outside its control.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-changes">12. Changes to This Policy</h2>
              <p>
                We reserve the right to update this Privacy Policy at any time. Continued use of the platform constitutes acceptance of any updated version.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-contact">13. Contact Information</h2>
              <div className="bg-muted p-4 rounded-lg mt-3">
                <p><strong>GAJO Creative Ltd</strong></p>
                <p>United Kingdom</p>
                <p><strong>Email:</strong> hello@gajocreative.co.uk</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
