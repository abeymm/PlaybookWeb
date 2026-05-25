import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canonical } from "@/lib/seo";
import { loadLegalDocument } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await loadLegalDocument("privacy");
  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.seo_description ?? doc.frontmatter.summary,
    alternates: canonical("/privacy"),
    robots: { index: true, follow: true },
  };
}

function formatLegalDate(iso: string): string {
  const cleanIso = iso.split(".")[0];
  return new Date(`${cleanIso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function PrivacyPage() {
  const doc = await loadLegalDocument("privacy");

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
        <h1 className="text-3xl font-bold tracking-tight">{doc.frontmatter.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last Updated: {formatLegalDate(doc.frontmatter.version)} | Effective Date:{" "}
          {formatLegalDate(doc.frontmatter.effective_date)}
        </p>
        {doc.intro_html ? (
          <div
            className="legal-prose mt-4"
            dangerouslySetInnerHTML={{ __html: doc.intro_html }}
          />
        ) : null}

        <article
          className="legal-prose mt-8"
          dangerouslySetInnerHTML={{ __html: doc.body_html }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          <p className="mb-2">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            {" | "}
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </p>
          <p>&copy; {new Date().getFullYear()} Expert Craft Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
