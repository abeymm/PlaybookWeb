import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocalFlowEnabled } from "@/lib/localflow/config";

export const metadata: Metadata = {
  title: "Local courseData",
  robots: { index: false, follow: false },
};

// /local — the all-on-this-Mac courseData flow. No auth shell, no Amplify: the page talks only
// to its own route handlers under /local/api; pages and handlers alike 404 outside `next dev`.
export default function LocalLayout({ children }: { children: React.ReactNode }) {
  if (!isLocalFlowEnabled()) notFound();
  return (
    <div className="flex min-h-screen min-w-[1280px] flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border bg-card px-6 py-2">
        <span className="text-sm font-semibold tracking-tight">Local courseData</span>
        <span className="text-xs text-muted-foreground">
          pick an OSM course from the local cache → generate on this Mac → correct → export a .playbook
        </span>
        <span className="ml-auto rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-400">
          dev server only · no S3 · no Lambda
        </span>
      </header>
      {children}
    </div>
  );
}
