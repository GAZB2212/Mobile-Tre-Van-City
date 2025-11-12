import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function TermsConditions() {
  useEffect(() => {
    document.title = "Terms and Conditions | Mobile Tyre Van Conversions";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Terms and conditions for using Mobile Tyre Van Conversions services and website."
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <Card data-testid="card-terms-conditions">
          <CardHeader>
            <CardTitle className="text-4xl">Terms and Conditions</CardTitle>
            <p className="text-muted-foreground">Last updated: November 2024</p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-slate dark:prose-invert max-w-none">
            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-introduction">1. Introduction</h2>
              <p>
                These Terms and Conditions ("Terms") govern your use of the Mobile Tyre Van Conversions website and services. By accessing or using our website, you agree to be bound by these Terms.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-definitions">2. Definitions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"Company", "we", "our", or "us"</strong> refers to Mobile Tyre Van Conversions</li>
                <li><strong>"Customer", "you", or "your"</strong> refers to the person or entity using our services</li>
                <li><strong>"Services"</strong> refers to van conversions, equipment installation, and related services</li>
                <li><strong>"Website"</strong> refers to our online platform and configurator system</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-quotes">3. Quotes and Orders</h2>
              <p className="font-semibold">Quote Validity</p>
              <p>All quotes are valid for 30 days from the date of issue unless otherwise stated.</p>
              
              <p className="font-semibold mt-4">Pricing</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All prices are in GBP (£) and exclude VAT unless stated otherwise</li>
                <li>VAT at the current rate will be added to all prices</li>
                <li>Prices are subject to change without notice</li>
                <li>Additional charges may apply for custom requirements or modifications</li>
              </ul>

              <p className="font-semibold mt-4">Order Acceptance</p>
              <p>
                A contract is formed when we accept your order. We reserve the right to refuse any order at our discretion.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-payment">4. Payment Terms</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>A deposit is required to secure your order (amount specified in quote)</li>
                <li>Full payment is due before delivery unless finance arrangements are in place</li>
                <li>We accept bank transfer, credit/debit cards, and finance applications</li>
                <li>Late payments may incur additional charges</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-delivery">5. Delivery and Installation</h2>
              <p className="font-semibold">Timescales</p>
              <p>
                Build times are estimates and may vary depending on vehicle availability, equipment supply, and other factors. We will keep you informed of any delays.
              </p>

              <p className="font-semibold mt-4">Collection and Delivery</p>
              <p>
                Arrangements for vehicle collection and delivery will be agreed upon order confirmation. Additional delivery charges may apply depending on location.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-warranty">6. Warranty and Returns</h2>
              <p className="font-semibold">Warranty Coverage</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All workmanship is guaranteed for 12 months from completion</li>
                <li>Equipment warranties are as per manufacturer specifications</li>
                <li>The warranty does not cover normal wear and tear or misuse</li>
              </ul>

              <p className="font-semibold mt-4">Cancellations</p>
              <p>
                Cancellation terms will be specified in your order confirmation. Deposits may be non-refundable once work has commenced.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-liability">7. Limitation of Liability</h2>
              <p>To the extent permitted by law:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We are not liable for any indirect, consequential, or special damages</li>
                <li>Our total liability is limited to the amount paid for the services in question</li>
                <li>We are not liable for delays caused by circumstances beyond our control</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-intellectual">8. Intellectual Property</h2>
              <p>
                All content on our website, including text, images, designs, and configurator tools, is our property or used with permission. You may not reproduce, distribute, or create derivative works without our written consent.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-data">9. Data Protection</h2>
              <p>
                Your use of our services is also governed by our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, which explains how we collect, use, and protect your personal information.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-governing">10. Governing Law</h2>
              <p>
                These Terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-changes-terms">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services constitutes acceptance of the modified Terms.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-3" data-testid="text-section-contact">12. Contact Information</h2>
              <p>For questions about these Terms, please contact us:</p>
              <div className="bg-muted p-4 rounded-lg mt-3">
                <p><strong>Email:</strong> info@mobiletyravan.co.uk</p>
                <p><strong>Phone:</strong> 01234 567890</p>
                <p><strong>Address:</strong> Mobile Tyre Van Conversions, Business Address, UK</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
