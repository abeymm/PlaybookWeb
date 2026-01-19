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
        <h1 className="text-3xl font-bold tracking-tight">Terms and Conditions</h1>
        <p className="mt-4 text-muted-foreground">
          Welcome to Golf Playbook. By using this app, you agree to the following terms and conditions:
        </p>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold">1. User Conduct</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Users are expected to conduct themselves in a respectful and lawful manner while using
              the Golf Playbook app. This includes, but is not limited to, the following:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Respecting the rights and privacy of other users.</li>
              <li>
                Not posting or sharing any content that is offensive, defamatory, or violates any
                laws.
              </li>
              <li>
                Not engaging in any activity that could harm the app&apos;s functionality or security.
              </li>
              <li>Not using the app for any unauthorized commercial purposes.</li>
            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Violation of these guidelines may result in the removal of content and/or termination
              of the user&apos;s account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Age Requirement</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              The app is currently rated 4+. However, we may consider changing the minimum age
              requirement to 13 in the future.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Intellectual Property</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              All content within the Golf Playbook app, including but not limited to text, graphics,
              logos, and software, is the property of the app and its licensors. Users are granted a
              limited license to access and use the app for personal, non-commercial purposes. Users
              are not permitted to copy, modify, distribute, or create derivative works based on any
              content from the app without express permission.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Users who contribute content to the app, such as notes and comments, grant the app a
              non-exclusive, royalty-free, perpetual license to use, display, and distribute the
              content within the app. Users are responsible for ensuring that their contributions do
              not infringe on any third-party intellectual property rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Disclaimer</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              The Golf Playbook app is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis. We make no warranties, express or implied, regarding the
              app&apos;s functionality, accuracy, reliability, or availability. Users acknowledge
              that the app may experience interruptions, errors, or other issues. We disclaim any
              liability for damages arising from the use or inability to use the app.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Users are responsible for verifying the accuracy of any information provided by the
              app, including calculations and estimations. We do not guarantee the accuracy or
              completeness of any information provided.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Liability</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, we shall not be liable for any direct,
              indirect, incidental, special, or consequential damages arising from the use or
              inability to use the Golf Playbook app. This includes, but is not limited to, damages
              for loss of profits, data, or other intangible losses.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Users agree to indemnify and hold harmless the app and its affiliates, officers, and
              employees from any claims, damages, or expenses arising from their use of the app or
              violation of these terms.
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
