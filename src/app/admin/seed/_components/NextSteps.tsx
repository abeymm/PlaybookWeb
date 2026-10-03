"use client";

// NextSteps — the post-save panel. On success: the three copyable command lines that pull the seed
// down and run make_coursedata.py. On failure: the structured findings from saveCourseSeed.

import { useState } from "react";
import { CheckIcon, CopyIcon, XIcon, AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SeedSaveResult } from "@/lib/coursedata/seed";

export interface NextStepsProps {
  result: SeedSaveResult;
  slug: string;
  bucket: string;
  onDismiss: () => void;
}

export default function NextSteps({ result, slug, bucket, onDismiss }: NextStepsProps) {
  if (result.ok) {
    return <SuccessPanel slug={slug} bucket={bucket} onDismiss={onDismiss} />;
  }
  return <FailurePanel result={result} onDismiss={onDismiss} />;
}

function SuccessPanel({
  slug,
  bucket,
  onDismiss,
}: {
  slug: string;
  bucket: string;
  onDismiss: () => void;
}) {
  const cacheDir = "~/Projects/Playbook/Scripts/regions/us/cache_manual";
  const commands = [
    `aws s3 cp s3://${bucket}/seeds/manual-${slug}.json ${cacheDir}/manual-${slug}.json`,
    `cd ~/Projects/Playbook/Training/segformer_green/golfapi_pipeline`,
    `../../.venv/bin/python core/make_coursedata.py --course-key manual-${slug} --osm-cache ${cacheDir} --out /tmp/coursedata_manual-${slug} --upload sandbox`,
  ];
  const all = commands.join("\n");

  return (
    <Panel onDismiss={onDismiss} title="Seed saved" tone="success">
      <p className="text-xs text-muted-foreground">
        Saved to{" "}
        <code className="rounded bg-muted px-1 font-mono">seeds/manual-{slug}.json</code>. Run these
        to generate the course data:
      </p>
      <div className="mt-2 flex items-start gap-2">
        <pre className="flex-1 overflow-x-auto rounded-md border border-border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
          {commands.join("\n")}
        </pre>
        <CopyButton text={all} label="Copy all" />
      </div>
    </Panel>
  );
}

function FailurePanel({ result, onDismiss }: { result: SeedSaveResult; onDismiss: () => void }) {
  const findings = result.findings ?? [];
  return (
    <Panel onDismiss={onDismiss} title="Save failed" tone="error">
      {/* Headline only when there is no structured list — findings[0] already carries it. */}
      {findings.length === 0 && result.error && (
        <p className="text-xs text-destructive">{result.error}</p>
      )}
      {findings.length > 0 ? (
        <ul className="mt-1 space-y-1">
          {findings.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs">
              <span
                className={cn(
                  "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                  f.level === "error" ? "bg-destructive" : "bg-amber-500"
                )}
              />
              <span>
                <code className="rounded bg-muted px-1 font-mono text-[11px]">{f.path}</code>{" "}
                <span className={f.level === "error" ? "text-destructive" : "text-amber-600"}>
                  {f.msg}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        !result.error && <p className="text-xs text-muted-foreground">Rejected by the server.</p>
      )}
    </Panel>
  );
}

function Panel({
  title,
  tone,
  children,
  onDismiss,
}: {
  title: string;
  tone: "success" | "error";
  children: React.ReactNode;
  onDismiss: () => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4 shadow-2xl">
      <div className="mx-auto max-w-4xl">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tone === "success" ? (
              <CheckIcon className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangleIcon className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      className="shrink-0 gap-1.5"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked — no-op */
        }
      }}
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
