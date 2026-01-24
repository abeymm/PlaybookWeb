import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo3d.png"
              alt="Golf Playbook"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-xl font-bold tracking-tight">Golf Playbook</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last Updated: January 2026 | Effective Date: January 2026
        </p>
        <p className="mt-4 text-muted-foreground">
          This Privacy Policy explains how Expert Craft Inc. (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          collects, uses, and protects your information when you use Golf Playbook. This policy applies to our
          mobile application, website, and all related services. By using our Service, you agree to the practices
          described in this policy. Please also review our{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
        </p>

        <div className="mt-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Expert Craft Inc. is a California company that operates Golf Playbook. We are committed to
              protecting your privacy and being transparent about the data we collect. This Privacy Policy
              applies to all users of the Golf Playbook mobile app, website at playbook.golf, and related services.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We collect different categories of information to provide and improve our Service:
            </p>

            <h3 className="mt-4 font-medium">Account Information</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>Name and email address</li>
              <li>Profile photo (optional)</li>
              <li>Account credentials (stored securely)</li>
            </ul>

            <h3 className="mt-4 font-medium">Golf Data</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>Playbooks you create, including notes and strategies</li>
              <li>Round data (scores, club selections, statistics)</li>
              <li>Course preferences and favorites</li>
              <li>Shared playbooks and community interactions</li>
            </ul>

            <h3 className="mt-4 font-medium">Device Information</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>Device type, model, and operating system version</li>
              <li>App version</li>
              <li>Unique device identifiers</li>
            </ul>

            <h3 className="mt-4 font-medium">Location Data</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>GPS location for course detection and on-course features (with your permission)</li>
              <li>You can disable location access in your device settings</li>
            </ul>

            <h3 className="mt-4 font-medium">Usage Data</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>Features used and actions taken</li>
              <li>Time spent in the app</li>
              <li>Error logs and performance data</li>
            </ul>

            <h3 className="mt-4 font-medium">Payment Information</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>Payment transactions are processed by Apple (in-app) or Stripe (web)</li>
              <li>We do not store your full credit card numbers</li>
              <li>We retain transaction records for order fulfillment and legal compliance</li>
            </ul>

            <h3 className="mt-4 font-medium">AI Interactions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>Queries and requests made to AI Caddie</li>
              <li>Recommendations provided to you</li>
              <li>This data helps improve AI accuracy and personalization</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We use your information for the following purposes:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Provide Services:</strong> Deliver app features, create playbooks, track rounds, and enable offline access.</li>
              <li><strong>Personalization:</strong> Customize your experience based on your preferences and playing history.</li>
              <li><strong>AI Caddie:</strong> Generate personalized club recommendations and course strategy suggestions.</li>
              <li><strong>Order Fulfillment:</strong> Process and ship printed playbook orders.</li>
              <li><strong>Customer Support:</strong> Respond to your questions and resolve issues.</li>
              <li><strong>Analytics:</strong> Understand how users interact with the app to improve features.</li>
              <li><strong>Marketing:</strong> Send promotional emails (you can opt out at any time).</li>
              <li><strong>Safety & Security:</strong> Detect and prevent fraud, abuse, and security threats.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold">4. How We Share Your Information</h2>

            <h3 className="mt-4 font-medium">Community Features</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              If you share playbooks with other users, your shared content (including your display name) will be
              visible to those users based on your sharing settings.
            </p>

            <h3 className="mt-4 font-medium">Service Providers</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              We work with trusted third-party service providers who help us operate our Service:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li><strong>Cloud Hosting:</strong> Amazon Web Services (AWS)</li>
              <li><strong>Authentication:</strong> AWS Cognito</li>
              <li><strong>Payment Processing:</strong> Stripe, Apple Pay</li>
              <li><strong>Email:</strong> AWS SES</li>
              <li><strong>Email Broadcasts:</strong> ConvertKit</li>
              <li><strong>Analytics:</strong> Mixpanel</li>
            </ul>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              These providers are contractually required to protect your data and use it only for the services they provide to us.
            </p>

            <h3 className="mt-4 font-medium">Legal Requirements</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              We may disclose your information if required by law, subpoena, or legal process, or if we believe
              disclosure is necessary to protect our rights, safety, or property.
            </p>

            <h3 className="mt-4 font-medium">Business Transfers</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              If Expert Craft Inc. is involved in a merger, acquisition, or sale of assets, your information may
              be transferred as part of that transaction. We will notify you of any such change.
            </p>

            <h3 className="mt-4 font-medium">We Do Not Sell Your Personal Information</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold">5. Data Retention</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We retain your information for as long as necessary to provide our services and fulfill the purposes
              described in this policy. Specific retention periods:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Account Data:</strong> Until you delete your account, plus 30 days for processing.</li>
              <li><strong>Playbooks & Notes:</strong> Until deleted by you.</li>
              <li><strong>Round Data:</strong> 3 years from creation date.</li>
              <li><strong>Payment Records:</strong> 7 years (legal and tax requirements).</li>
              <li><strong>Analytics Data:</strong> 2 years in aggregated form; 90 days for individual-level data.</li>
              <li><strong>Support Communications:</strong> 2 years from last contact.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold">6. Your Privacy Rights</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              You have the following rights regarding your personal information:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information in your account settings or by contacting us.</li>
              <li><strong>Deletion:</strong> Delete your account and associated data through the app settings or by contacting us.</li>
              <li><strong>Portability:</strong> Export your playbooks in a portable format.</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails using the link in any email, or manage notification preferences in the app.</li>
            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              To exercise these rights, contact us at{" "}
              <a href="mailto:support@playbook.golf" className="text-primary hover:underline">
                support@playbook.golf
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold">7. California Privacy Rights (CCPA/CPRA)</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA)
              and California Privacy Rights Act (CPRA):
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Right to Know:</strong> You can request information about the categories and specific pieces of personal information we have collected about you, the sources of that information, our business purposes for collecting it, and the categories of third parties with whom we share it.</li>
              <li><strong>Right to Delete:</strong> You can request that we delete the personal information we have collected from you, subject to certain exceptions.</li>
              <li><strong>Right to Opt-Out of Sale:</strong> We do not sell personal information, so this right does not apply.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
              <li><strong>Right to Correct:</strong> You can request that we correct inaccurate personal information.</li>
              <li><strong>Right to Limit Use of Sensitive Information:</strong> You can limit how we use sensitive personal information.</li>
            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              To exercise your California privacy rights, contact us at{" "}
              <a href="mailto:support@playbook.golf" className="text-primary hover:underline">
                support@playbook.golf
              </a>
              {" "}or call 832-533-7573. We may need to verify your identity before processing your request.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold">8. AI & Automated Decision-Making</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Our AI Caddie feature uses automated processing to provide personalized golf recommendations.
              Here&apos;s what you should know:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>How It Works:</strong> AI Caddie analyzes your playing data, club distances, and course information to generate club recommendations and strategy suggestions.</li>
              <li><strong>No Legal Effects:</strong> AI recommendations do not have legal or similarly significant effects on you. They are advisory suggestions only.</li>
              <li><strong>Opt-Out:</strong> You can choose not to use AI Caddie features. Your core app experience will not be affected.</li>
              <li><strong>Human Review:</strong> You always make the final decision on the course. AI recommendations are meant to assist, not replace, your judgment.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-semibold">9. Children&apos;s Privacy</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Golf Playbook is not directed at children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If we learn that we have collected personal information
              from a child under 13, we will delete that information promptly.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              If you are a parent or guardian and believe your child has provided us with personal information,
              please contact us at{" "}
              <a href="mailto:support@playbook.golf" className="text-primary hover:underline">
                support@playbook.golf
              </a>
              .
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-semibold">10. Cookies & Tracking (Website)</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Our website uses cookies and similar technologies:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly (e.g., authentication, security).</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website. You can opt out of analytics cookies.</li>
              <li><strong>No Third-Party Advertising:</strong> We do not use third-party advertising cookies or sell data to advertisers.</li>
            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              You can manage cookies through your browser settings. Disabling certain cookies may affect website functionality.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-semibold">11. Security</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Encryption:</strong> Data is encrypted in transit (TLS) and at rest.</li>
              <li><strong>Access Controls:</strong> Only authorized personnel can access personal data.</li>
              <li><strong>Regular Reviews:</strong> We conduct regular security assessments and updates.</li>
              <li><strong>Incident Response:</strong> We have procedures to detect, respond to, and recover from security incidents.</li>
            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              While we take security seriously, no system is completely secure. If you believe your account
              has been compromised, contact us immediately.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-xl font-semibold">12. International Data Transfers</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Your information is processed and stored in the United States. If you are using our Service from
              outside the United States, your information will be transferred to and processed in the United States.
              By using our Service, you consent to this transfer.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              For users in the European Economic Area (EEA), we rely on standard contractual clauses and other
              appropriate safeguards for international data transfers.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-xl font-semibold">13. Changes to This Policy</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology,
              legal requirements, or other factors. When we make material changes, we will notify you through
              the app or by email before the changes take effect.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Your continued use of the Service after the effective date of any changes constitutes your acceptance
              of the updated Privacy Policy. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-xl font-semibold">14. Contact Us</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                Email:{" "}
                <a href="mailto:support@playbook.golf" className="text-primary hover:underline">
                  support@playbook.golf
                </a>
              </li>
              <li>Phone: 832-533-7573</li>
              <li>Company: Expert Craft Inc., California, USA</li>
            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We aim to respond to all inquiries within 30 days.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          <p className="mb-2">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            {" | "}
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </p>
          <p>&copy; {new Date().getFullYear()} Expert Craft Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
