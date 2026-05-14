import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms & Conditions"
        description="Terms and conditions for using Mobile Tyre Van City's website and services."
        canonical="/terms-conditions"
        noindex={true}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <Card data-testid="card-terms-conditions">
          <CardHeader>
            <CardTitle className="text-4xl">Terms &amp; Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-invert max-w-none">
            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-introduction">1. Introduction</h2>
              <p>
                These Terms govern access to and use of the Mobile Tyre Van Conversions website platform, configurator systems, digital infrastructure, and associated services.
              </p>
              <p className="mt-3">
                The digital platform and all associated systems are owned exclusively by GAJO Creative Ltd and licensed for operational use by Mobile Tyre Van Conversions ("Operating Business").
              </p>
              <p className="mt-3">
                By using the platform or services, you agree to these Terms.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-definitions">2. Definitions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"GAJO"</strong> refers to GAJO Creative Ltd.</li>
                <li><strong>"Operating Business"</strong> refers to Mobile Tyre Van Conversions.</li>
                <li><strong>"Platform"</strong> refers to the website, configurator systems, CRM systems, databases, software, automation systems, APIs, AI systems, workflows, and associated infrastructure owned by GAJO.</li>
                <li><strong>"Services"</strong> refers to vehicle conversion and associated operational services offered by the Operating Business.</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-quotes">3. Quotations &amp; Orders</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Quotations remain valid for 30 days unless otherwise stated.</li>
                <li>Prices are in GBP (£) excluding VAT unless stated otherwise.</li>
                <li>Orders are accepted only upon written confirmation.</li>
                <li>Specifications and pricing may change without notice.</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-payment">4. Payments</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Deposits may be required.</li>
                <li>Full payment must be received before delivery unless alternative arrangements exist.</li>
                <li>Late payments may incur fees or suspension of services.</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-delivery">5. Build &amp; Delivery Times</h2>
              <p>
                Build and delivery dates are estimates only and may vary due to supply chain, vehicle availability, technical, operational, or external factors.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-warranty">6. Warranty</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Workmanship warranties apply only as specified in writing.</li>
                <li>Manufacturer warranties remain subject to manufacturer terms.</li>
                <li>Warranty does not cover misuse, unauthorised modification, or normal wear and tear.</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-liability">7. Limitation of Liability</h2>
              <p>To the fullest extent permitted by law:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>GAJO and the Operating Business exclude liability for indirect or consequential loss.</li>
                <li>Liability shall not exceed the amount paid for relevant services.</li>
                <li>No liability is accepted for operational interruption, data loss, third-party failures, or events outside reasonable control.</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-intellectual">8. Intellectual Property Ownership</h2>
              <p>
                All rights, title, and interest in the Platform and all associated Digital Assets remain exclusively vested in GAJO Creative Ltd.
              </p>
              <p className="mt-3">This includes but is not limited to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Source code</li>
                <li>Software architecture</li>
                <li>Configurator systems</li>
                <li>CRM systems</li>
                <li>Databases</li>
                <li>APIs</li>
                <li>Automation workflows</li>
                <li>AI systems</li>
                <li>Enquiry systems</li>
                <li>SEO structures</li>
                <li>Designs and layouts</li>
                <li>Branding assets</li>
                <li>Graphics and content</li>
                <li>Hosting architecture</li>
                <li>Customer workflows</li>
                <li>Backend infrastructure</li>
              </ul>
              <p className="mt-3">
                The Operating Business accesses and uses the Platform strictly under licence.
              </p>
              <p className="mt-3">
                No use, contribution, operational involvement, commercial arrangement, payment, access, collaboration, or business relationship shall create or imply any transfer, assignment, beneficial interest, equitable interest, partnership ownership, or intellectual property rights in favour of any third party unless expressly agreed in a signed written agreement executed by GAJO Creative Ltd.
              </p>
              <p className="mt-3">
                GAJO reserves all rights relating to the Platform and Digital Assets, including rights to modify, suspend, revoke, rebrand, relicense, migrate, or otherwise control the Platform at its sole discretion subject to any binding written agreements.
              </p>
              <p className="mt-3">
                Unauthorised reproduction, extraction, reverse engineering, copying, distribution, or modification is strictly prohibited.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-data">9. Data Protection</h2>
              <p>
                Use of the Platform is also governed by the <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-governing">10. Governing Law</h2>
              <p>
                These Terms are governed by the laws of England and Wales.
              </p>
              <p className="mt-3">
                Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-changes-terms">11. Changes to Terms</h2>
              <p>
                We reserve the right to amend these Terms at any time.
              </p>
              <p className="mt-3">
                Continued use of the Platform constitutes acceptance of amended Terms.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-contact">12. Contact Information</h2>
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
