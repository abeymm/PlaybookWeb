"use client";

// RunPanel — one long-running local job (generate or export): the action button, the job's
// status, and a tail of its log file.

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/app/admin/_components/ui";
import { cn } from "@/lib/utils";
import type { JobView } from "@/lib/localflow/types";

export interface RunPanelProps {
  title: string;
  hint: string;
  view: JobView | null;
  actionLabel: string;
  actionDisabled?: boolean;
  onAction: () => void;
  /** Rendered after the status line (e.g. output facts, download links). */
  children?: React.ReactNode;
}

function statusChip(status: string | undefined) {
  switch (status) {
    case "running":
      return <Chip className="border-blue-300 text-blue-700 dark:text-blue-300">running</Chip>;
    case "succeeded":
      return <Chip className="border-emerald-300 text-emerald-700 dark:text-emerald-300">succeeded</Chip>;
    case "failed":
      return <Chip className="border-red-300 text-red-700 dark:text-red-300">failed</Chip>;
    default:
      return <Chip>idle</Chip>;
  }
}

export default function RunPanel(props: RunPanelProps) {
  const { title, hint, view, actionLabel, actionDisabled, onAction, children } = props;
  const job = view?.job ?? null;
  const running = job?.status === "running";
  const logRef = useRef<HTMLPreElement>(null);

  // Keep the newest log lines in view while a job runs.
  useEffect(() => {
    const el = logRef.current;
    if (el && running) el.scrollTop = el.scrollHeight;
  }, [view?.logTail, running]);

  return (
    <section className="flex flex-col gap-2 border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          {statusChip(job?.status)}
          {job?.startedAt && (
            <span className="text-muted-foreground">
              started {new Date(job.startedAt).toLocaleTimeString()}
              {job.endedAt && ` · ended ${new Date(job.endedAt).toLocaleTimeString()}`}
              {job.exitCode != null && job.status !== "running" && ` · exit ${job.exitCode}`}
            </span>
          )}
          {job?.error && <span className="text-destructive">{job.error}</span>}
          <Button size="sm" onClick={onAction} disabled={actionDisabled || running}>
            {running ? "Running…" : actionLabel}
          </Button>
        </div>
      </div>
      {children}
      {view?.logTail && (
        <pre
          ref={logRef}
          className={cn(
            "max-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px] leading-snug",
            job?.status === "failed" && "border-red-300"
          )}
        >
          {view.logTail}
        </pre>
      )}
    </section>
  );
}
