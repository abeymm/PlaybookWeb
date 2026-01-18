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
              src="/logo3d.png"
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
        <p className="mt-4 text-muted-foreground">
          This Privacy Policy outlines how Golf Playbook collects, uses, and protects user information.
        </p>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold">1. Information Collection</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Golf Playbook collects information to provide better services to users. This includes
              information provided by users, such as name, email address, and location data when
              creating an account or using features. Additionally, we collect usage data, device
              information, and preferences to enhance user experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information Usage</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Collected information is used to provide and improve the app&apos;s services, personalize
              user experience, and communicate with users. We use data to understand user preferences,
              enhance features, and develop new services. Additionally, we may use information for
              analytics and performance measurement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Information Sharing</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We do not share personal information with third parties except as required by law, to
              protect our rights, or with user consent. We may share aggregated or de-identified
              information for analytics and service improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Data Security</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We implement security measures to protect user information from unauthorized access,
              alteration, or disclosure. These measures include encryption, access controls, and
              regular security assessments to ensure data integrity and confidentiality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. User Rights</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Users have the right to access, update, or delete their personal information. They can
              also opt out of certain data collection practices and manage their privacy settings
              within the app. We provide tools and resources to help users exercise their rights and
              maintain control over their data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Changes to Privacy Policy</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or for other operational, legal, or regulatory reasons. Users will be notified of any
              significant changes through the app or via email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Contact Information</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact us at{" "}
              <a
                href="mailto:support@playbook.golf"
                className="text-primary hover:underline"
              >
                support@playbook.golf
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Golf Playbook. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
