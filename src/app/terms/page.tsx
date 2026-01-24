import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last Updated: January 2026 | Effective Date: January 2026
        </p>
        <p className="mt-4 text-muted-foreground">
          Welcome to Golf Playbook, operated by Expert Craft Inc. (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
          By using our mobile application, website, or any related services (collectively, the &ldquo;Service&rdquo;),
          you agree to these Terms of Service. Please also review our{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>,
          which describes how we collect and use your information.
        </p>

        <div className="mt-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold">1. Introduction & Acceptance</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              These Terms of Service govern your access to and use of Golf Playbook, including our
              mobile application, website at playbook.golf, printed playbook products, and all related
              services. By creating an account, accessing, or using any part of the Service, you agree
              to be bound by these Terms.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              If you do not agree to these Terms, you may not access or use the Service. We may update
              these Terms from time to time, and your continued use of the Service after any changes
              constitutes acceptance of those changes.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold">2. Eligibility & Accounts</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Age Requirement:</strong> You must be at least 13 years old to use the Service.
              If you are under 18, you represent that you have your parent or guardian&apos;s permission to use the Service.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Account Creation:</strong> To access certain features, you must create an account.
              You agree to provide accurate information and keep it updated. You are responsible for
              maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Account Termination:</strong> We reserve the right to suspend or terminate your
              account at any time for violation of these Terms or for any other reason at our discretion.
              You may also delete your account at any time through the app settings.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold">3. Description of Services</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Golf Playbook provides golf course strategy and planning tools, including:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong>Mobile App:</strong> Course strategy tools, playbook creation, offline access to your playbooks,
                round tracking, and personalized notes for golf courses.
              </li>
              <li>
                <strong>AI Caddie:</strong> AI-powered club recommendations and course strategy suggestions based
                on your playing data. These recommendations are advisory only and should not be considered
                professional golf instruction.
              </li>
              <li>
                <strong>Print Products:</strong> Physical printed playbooks that you can order for your favorite courses.
              </li>
              <li>
                <strong>Community Features:</strong> Ability to share playbooks with other users and discover
                playbooks created by the community.
              </li>
              <li>
                <strong>B2B Services:</strong> Course partnerships, tournament services, and custom solutions
                for golf courses and organizations.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold">4. User Conduct</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              You agree to use the Service in a respectful and lawful manner. You will not:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Violate any applicable laws or regulations.</li>
              <li>Infringe on the rights or privacy of others.</li>
              <li>Post or share content that is offensive, defamatory, or harmful.</li>
              <li>Attempt to interfere with the Service&apos;s functionality or security.</li>
              <li>Use the Service for unauthorized commercial purposes or resale without our permission.</li>
              <li>Misuse AI features by attempting to manipulate or exploit recommendations.</li>
              <li>Create multiple accounts to circumvent restrictions or abuse the Service.</li>
            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Violation of these guidelines may result in removal of content and/or termination of your account.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold">5. User-Generated Content</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>License Grant:</strong> When you create playbooks, notes, or other content and choose to
              share it with the community, you grant us a non-exclusive, royalty-free, worldwide license to
              use, display, and distribute that content within the Service.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Content Visibility:</strong> Shared playbooks may be visible to other users based on
              your sharing settings. You control whether your content is private, shared with specific users,
              or public.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Content Moderation:</strong> We reserve the right to remove or modify content that
              violates these Terms or is otherwise objectionable, at our sole discretion.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Responsibility:</strong> You are solely responsible for the content you create and share.
              You represent that you have all necessary rights to the content and that it does not infringe
              on any third-party intellectual property rights.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Our Content:</strong> The Service and its contents, including but not limited to text,
              graphics, logos, icons, images, software, and the overall design and look-and-feel, are the
              property of Expert Craft Inc. and are protected by copyright, trademark, and other intellectual
              property laws.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Limited License:</strong> We grant you a limited, non-exclusive, non-transferable license
              to access and use the Service for personal, non-commercial purposes. You may not copy, modify,
              distribute, sell, or create derivative works based on our content without express permission.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Restrictions:</strong> You may not reverse engineer, decompile, or disassemble any
              part of the Service, except as permitted by applicable law.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold">7. AI Services Disclaimer</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Our AI Caddie feature provides club recommendations and course strategy suggestions based on
              your data and general golf principles. Please understand:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong>Advisory Only:</strong> AI recommendations are suggestions, not guarantees. They should
                be used as one input in your decision-making, not as absolute direction.
              </li>
              <li>
                <strong>Not Professional Instruction:</strong> The AI Caddie is not a substitute for professional
                golf instruction or coaching. For improving your game, consult a qualified golf professional.
              </li>
              <li>
                <strong>No Accuracy Guarantee:</strong> While we strive for accuracy, AI recommendations may
                not account for all course conditions, weather factors, or personal circumstances.
              </li>
              <li>
                <strong>Your Responsibility:</strong> You are solely responsible for your on-course decisions.
                We are not liable for any outcomes resulting from following AI recommendations.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold">8. Print Products & Orders</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Order Processing:</strong> When you order a printed playbook, you are making an offer to
              purchase. We may accept or decline orders at our discretion. Accepted orders will be confirmed
              via email.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Pricing & Payment:</strong> Prices are listed in USD and may vary based on product type,
              cover options, and shipping destination. All prices are subject to change. Payment is processed
              securely through Apple Pay or Stripe.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Shipping:</strong> We ship to addresses within the United States. Delivery times vary
              based on location and shipping method selected. We are not responsible for delays caused by
              shipping carriers.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Returns & Refunds:</strong> Due to the custom nature of our printed playbooks, we only
              accept returns for defective or damaged products. If you receive a defective product, contact us
              within 14 days of delivery at support@playbook.golf for a replacement or refund.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Quality Disclaimer:</strong> Printed playbooks are produced using the data available at
              the time of order. Course information may change after printing.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-semibold">9. B2B Services</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              For golf courses, tournaments, and organizations using our partnership services:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong>Separate Agreements:</strong> B2B services are governed by separate service agreements
                that supplement these Terms.
              </li>
              <li>
                <strong>Custom Terms:</strong> Course partnerships, tournament services, and partner integrations
                may have custom pricing, service levels, and terms specific to each arrangement.
              </li>
              <li>
                <strong>Contact:</strong> For B2B inquiries, contact us at support@playbook.golf.
              </li>
            </ul>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-semibold">10. Third-Party Services & Integrations</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              The Service may integrate with or contain links to third-party websites, services, or content.
              We are not responsible for the availability, accuracy, or content of these third-party services.
              Your use of third-party services is subject to their respective terms and privacy policies.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We may use third-party data providers for course information. While we strive to ensure accuracy,
              we do not guarantee the completeness or accuracy of third-party data.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-semibold">11. Payment Terms</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Payment Processing:</strong> Payments are processed securely through Apple (for in-app
              purchases) or Stripe (for web purchases). We do not store your full payment card information.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Pricing:</strong> All prices are in USD unless otherwise stated. Prices are subject to
              change without notice, but changes will not affect orders already placed.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Taxes:</strong> Prices may not include applicable taxes. You are responsible for any
              taxes associated with your purchases.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-xl font-semibold">12. Service Availability</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We strive to keep the Service available and functioning properly, but we do not guarantee
              uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates,
              or technical issues. We reserve the right to modify, suspend, or discontinue any feature or
              the entire Service at any time.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-xl font-semibold">13. Disclaimer of Warranties</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES
              OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We do not warrant that the Service will be error-free, secure, or uninterrupted. Golf strategy
              information and AI recommendations are provided for informational purposes only and should not
              be relied upon as professional advice.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-xl font-semibold">14. Limitation of Liability</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, EXPERT CRAFT INC. AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
              AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Our total liability for any claims arising from your use of the Service shall not exceed the
              amount you paid to us in the twelve (12) months preceding the claim, or $100, whichever is greater.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Indemnification:</strong> You agree to indemnify and hold harmless Expert Craft Inc. and
              its affiliates from any claims, damages, or expenses arising from your use of the Service or
              violation of these Terms.
            </p>
          </section>

          {/* Section 15 */}
          <section>
            <h2 className="text-xl font-semibold">15. Dispute Resolution</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Governing Law:</strong> These Terms are governed by the laws of the State of California,
              USA, without regard to conflict of law principles.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Informal Resolution:</strong> Before filing any formal legal claim, you agree to contact
              us at support@playbook.golf to attempt to resolve the dispute informally. We will try to resolve
              the dispute within 30 days.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Venue:</strong> Any legal action arising from these Terms shall be brought in the state
              or federal courts located in California, and you consent to the jurisdiction of such courts.
            </p>
          </section>

          {/* Section 16 */}
          <section>
            <h2 className="text-xl font-semibold">16. Modifications to Terms</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We may modify these Terms at any time. When we make material changes, we will notify you through
              the app or by email. Your continued use of the Service after such notification constitutes
              acceptance of the modified Terms. If you do not agree to the modified Terms, you should stop
              using the Service.
            </p>
          </section>

          {/* Section 17 */}
          <section>
            <h2 className="text-xl font-semibold">17. General Provisions</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and Expert Craft Inc. regarding the Service.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable,
              the remaining provisions will continue in full force and effect.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Waiver:</strong> Our failure to enforce any provision of these Terms does not constitute
              a waiver of that provision.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <strong>Assignment:</strong> You may not assign your rights under these Terms without our consent.
              We may assign our rights to any successor or affiliate.
            </p>
          </section>

          {/* Section 18 */}
          <section>
            <h2 className="text-xl font-semibold">18. Contact Information</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us:
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
