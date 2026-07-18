"use client";

// /admin/jobs — read-only CourseDataJob ledger (Spec §W2.4 / D2: NO trigger buttons).

import { Fragment, useMemo, useState } from "react";
import { PageHeader } from "../_components/PageHeader";
import { Chip, Table, Th, Td } from "../_components/ui";
import { ErrorState, EmptyState, TableSkeleton } from "../_components/states";
import { useAsync } from "../_components/hooks";
import { listJobs, type Page } from "@/lib/coursedata/api";
import type { CourseDataJobRow } from "@/lib/coursedata/types";

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  FAILED: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  QUEUED: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
};

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, loading, error, reload } = useAsync<Page<CourseDataJobRow>>(
    () => listJobs({ limit: 500 }),
    []
  );

  const rows = useMemo(() => {
    let items = data?.items ?? [];
    if (statusFilter) items = items.filter((j) => j.status === statusFilter);
    return [...items].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }, [data, statusFilter]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Jobs" subtitle="RunPod generation ledger (read-only)." />
      <div className="flex items-end gap-2 px-6 py-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Any</option>
            {["QUEUED", "SUBMITTED", "IN_PROGRESS", "COMPLETED", "FAILED"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="px-6 pb-8">
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="No jobs yet" hint="RunPod generation jobs will appear here once submitted." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>osmId</Th>
                <Th>Status</Th>
                <Th>Requested by</Th>
                <Th>s3Key</Th>
                <Th>Updated</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <Fragment key={j.id}>
                  <tr className="hover:bg-muted/40">
                    <Td className="font-mono text-xs">{j.osmId}</Td>
                    <Td>
                      <Chip className={STATUS_STYLE[j.status] ?? STATUS_STYLE.QUEUED}>{j.status}</Chip>
                    </Td>
                    <Td className="text-xs">{j.requestedBy ?? "—"}</Td>
                    <Td className="max-w-[280px] truncate font-mono text-xs" >{j.s3Key ?? "—"}</Td>
                    <Td className="text-xs">{j.updatedAt ? new Date(j.updatedAt).toLocaleString() : "—"}</Td>
                    <Td>
                      {j.error && (
                        <button
                          className="text-xs text-destructive underline"
                          onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                        >
                          {expanded === j.id ? "hide error" : "error"}
                        </button>
                      )}
                    </Td>
                  </tr>
                  {expanded === j.id && j.error && (
                    <tr>
                      <td colSpan={6} className="border-b border-border/60 bg-muted/30 px-3 py-2">
                        <pre className="whitespace-pre-wrap break-words text-xs text-destructive">
                          {j.error}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
