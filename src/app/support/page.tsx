import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon, MailIcon, FileTextIcon, ShieldIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SupportPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="mt-4 text-muted-foreground">
          Need help with Golf Playbook? We&apos;re here to assist you.
        </p>

        <div className="mt-8 space-y-6">
          {/* Contact Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MailIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Contact Us</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Have a question, feedback, or need assistance? Send us an email and we&apos;ll
                    get back to you as soon as possible.
                  </p>
                  <a
                    href="mailto:support@playbook.golf"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    support@playbook.golf
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <ShieldIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Privacy Policy</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Learn how we handle your data.
                    </p>
                    <Link
                      href="/privacy"
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      Read Policy
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Terms of Service</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Review our terms and conditions.
                    </p>
                    <Link
                      href="/terms"
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      Read Terms
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium">How do I create a playbook?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open the app, tap the + button, and select a golf course. You can then add
                  strategies for each hole.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Can I use the app offline?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Yes! Golf Playbook works offline on iOS. Your playbooks sync automatically when
                  you&apos;re back online.
                </p>
              </div>
              <div>
                <h3 className="font-medium">How do I print my playbook?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open your playbook, tap the share button, and select &ldquo;Print&rdquo; to
                  generate a print-ready PDF.
                </p>
              </div>
              <div>
                <h3 className="font-medium">How do I delete my account?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Go to Settings in the app and select &ldquo;Delete Account&rdquo;. This will
                  permanently remove all your data.
                </p>
              </div>
            </div>
          </div>
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
