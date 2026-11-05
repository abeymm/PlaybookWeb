"use client";

// /admin/review — the triage queue (Spec §W2 review + F4 + Design + DT2/DT3).
// Queue = rows with reviewStatus unreviewed|needs_fix, DEFAULT filtered to latest batchId, ranked
// (demand desc, qcErrors desc, qcWarnings desc). Keyboard: J/K row nav, Enter opens, A/X/F triage
// (approve/reject/needs_fix) with save-and-advance. Bulk needs_fix/reject always; bulk-approve only
// for clean rows (qcErrors=0 ∧ qcWarnings=0). Celebratory empty state. "N of M remaining" +
// reviewed-today counter.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopperIcon } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { Chip, Table, Th, Td } from "../_components/ui";
import { ErrorState, LoadingState, EmptyState } from "../_components/states";
import { useAsync } from "../_components/hooks";
import { Button } from "@/components/ui/button";
import { reviewChip, qcSeverityChip } from "@/lib/coursedata/colors";
import { listAllCourses, playbookDemand, updateCourseIndex } from "@/lib/coursedata/api";
import { isQueued, buildQueue, latestBatchId, isBulkApproveEligible } from "@/lib/coursedata/queue";
import type { CourseIndexRow, ReviewStatus } from "@/lib/coursedata/types";

const SCAN_CAP = 10; // ≤10 pages

async function loadQueueRows(): Promise<{ rows: CourseIndexRow[]; truncated: boolean }> {
  const rows: CourseIndexRow[] = [];
  let nextToken: string | null | undefined = undefined;
  let pages = 0;
  do {
    const page = await listAllCourses({ limit: 1000, nextToken });
    rows.push(...page.items.filter(isQueued));
    nextToken = page.nextToken;
    pages++;
  } while (nextToken && pages < SCAN_CAP);
  return { rows, truncated: !!nextToken };
}

function todayKey(): string {
  return `reviewed-today:${new Date().toISOString().slice(0, 10)}`;
}

export default function ReviewPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(loadQueueRows, []);
  const [overrides, setOverrides] = useState<Record<string, ReviewStatus>>({});
  const [demand, setDemand] = useState<Record<string, number | null>>({});
  const demandInFlight = useRef<Set<string>>(new Set());
  const [batch, setBatch] = useState<string | "all" | null>(null);
  const [focused, setFocused] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewedToday, setReviewedToday] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Sync the reviewed-today counter from localStorage (external store) on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReviewedToday(Number(window.localStorage.getItem(todayKey()) ?? 0));
  }, []);

  const baseRows = useMemo(() => {
    const rows = data?.rows ?? [];
    // Apply local triage overrides; rows moved out of the queue (approved/rejected) drop off.
    return rows
      .map((r) => (overrides[r.osmId] ? { ...r, reviewStatus: overrides[r.osmId] } : r))
      .filter(isQueued)
      .map((r) => ({ ...r, demandCount: demand[r.osmId] ?? r.demandCount }));
  }, [data, overrides, demand]);

  const batches = useMemo(() => {
    const s = new Set<string>();
    for (const r of data?.rows ?? []) if (r.batchId) s.add(r.batchId);
    return [...s].sort().reverse();
  }, [data]);

  const latest = useMemo(() => latestBatchId(data?.rows ?? []), [data]);
  const effectiveBatch = batch === null ? latest : batch; // default = latest batch

  const queue = useMemo(
    () => buildQueue(baseRows, { batchId: effectiveBatch === "all" ? undefined : effectiveBatch }),
    [baseRows, effectiveBatch]
  );

  // Lazy demand for the visible queue.
  const fetchDemand = useCallback(
    (osmId: string) => {
      if (osmId in demand || demandInFlight.current.has(osmId)) return;
      demandInFlight.current.add(osmId);
      playbookDemand(osmId)
        .then((n) => setDemand((d) => ({ ...d, [osmId]: n })))
        .catch(() => setDemand((d) => ({ ...d, [osmId]: null })))
        .finally(() => demandInFlight.current.delete(osmId));
    },
    [demand]
  );
  useEffect(() => {
    for (const r of queue.slice(0, 100)) fetchDemand(r.osmId);
  }, [queue, fetchDemand]);

  // Derived (not state): clamp focus to the current queue length instead of a sync effect.
  const focusedIdx = queue.length ? Math.min(focused, queue.length - 1) : 0;

  const bumpReviewedToday = useCallback(() => {
    setReviewedToday((n) => {
      const next = n + 1;
      if (typeof window !== "undefined") window.localStorage.setItem(todayKey(), String(next));
      return next;
    });
  }, []);

  const triage = useCallback(
    async (row: CourseIndexRow, status: ReviewStatus, advance = true) => {
      setOverrides((o) => ({ ...o, [row.osmId]: status }));
      bumpReviewedToday();
      if (advance) setFocused((f) => f); // stay at same index; the row drops out and the next slides up
      try {
        await updateCourseIndex({
          osmId: row.osmId,
          reviewStatus: status,
          reviewedAt: new Date().toISOString(),
        });
      } catch {
        // Roll back the optimistic override on failure.
        setOverrides((o) => {
          const n = { ...o };
          delete n[row.osmId];
          return n;
        });
      }
    },
    [bumpReviewedToday]
  );

  // Keyboard triage (ignore while typing in an input/textarea — B9.6).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const row = queue[focusedIdx];
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocused((f) => Math.min(queue.length - 1, f + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocused((f) => Math.max(0, f - 1));
      } else if (e.key === "Enter" && row) {
        router.push(`/admin/courses/${encodeURIComponent(row.osmId)}`);
      } else if (e.key === "a" && row) {
        triage(row, "approved");
      } else if (e.key === "x" && row) {
        triage(row, "rejected");
      } else if (e.key === "f" && row) {
        triage(row, "needs_fix");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queue, focusedIdx, router, triage]);

  const selectedRows = queue.filter((r) => selected.has(r.osmId));
  const canBulkApprove = selectedRows.length > 0 && selectedRows.every(isBulkApproveEligible);

  async function bulk(status: ReviewStatus) {
    const rows = [...selectedRows];
    setSelected(new Set());
    for (const r of rows) await triage(r, status, false);
  }

  const totalRemaining = baseRows.length;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Review queue"
        subtitle="Ranked by demand, then QC severity. J/K to move · Enter to open · A approve · X reject · F needs-fix."
        actions={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {queue.length} of {totalRemaining} remaining
            </span>
            <span className="rounded-md bg-muted px-2 py-1">Reviewed today: {reviewedToday}</span>
          </div>
        }
      />

      <div className="flex items-center gap-2 px-6 py-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Batch
        </span>
        <select
          value={effectiveBatch ?? "all"}
          onChange={(e) => setBatch(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="all">All batches</option>
          {batches.map((b) => (
            <option key={b} value={b}>
              {b}
              {b === latest ? " (latest)" : ""}
            </option>
          ))}
        </select>

        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulk("needs_fix")}>
              Bulk needs-fix
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulk("rejected")}>
              Bulk reject
            </Button>
            <Button
              size="sm"
              onClick={() => bulk("approved")}
              disabled={!canBulkApprove}
              title={canBulkApprove ? "" : "Bulk-approve is only allowed for clean rows (no errors or warnings)."}
            >
              Bulk approve (clean)
            </Button>
          </div>
        )}
      </div>

      <div className="px-6 pb-8">
        {loading ? (
          <LoadingState label="Building the queue…" />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : queue.length === 0 ? (
          <EmptyState
            title="Queue cleared — nice work!"
            hint="No unreviewed or needs-fix courses in this batch. Switch batches or come back after the next RunPod drop."
            icon={<PartyPopperIcon className="h-8 w-8 text-primary" />}
          />
        ) : (
          <>
            {data?.truncated && (
              <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
                Queue scan truncated — some far-down rows may be missing.
              </p>
            )}
            <Table>
              <thead>
                <tr>
                  <Th>
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={selected.size === queue.length && queue.length > 0}
                      onChange={(e) =>
                        setSelected(e.target.checked ? new Set(queue.map((r) => r.osmId)) : new Set())
                      }
                    />
                  </Th>
                  <Th>Name / location</Th>
                  <Th>Demand</Th>
                  <Th>QC</Th>
                  <Th>Status</Th>
                  <Th>Triage</Th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r, i) => {
                  const rc = reviewChip(r.reviewStatus);
                  const qc = qcSeverityChip(r.qcErrors, r.qcWarnings);
                  return (
                    <tr
                      key={r.osmId}
                      onClick={() => setFocused(i)}
                      className={
                        "cursor-pointer " + (i === focusedIdx ? "bg-primary/10" : "hover:bg-muted/40")
                      }
                    >
                      <Td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.name}`}
                          checked={selected.has(r.osmId)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelected((s) => {
                              const n = new Set(s);
                              if (e.target.checked) n.add(r.osmId);
                              else n.delete(r.osmId);
                              return n;
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Td>
                      <Td>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                        </div>
                      </Td>
                      <Td className="tabular-nums">
                        {demand[r.osmId] === undefined ? "…" : (demand[r.osmId] ?? "?")}
                      </Td>
                      <Td>
                        <Chip className={qc.className}>{qc.label}</Chip>
                      </Td>
                      <Td>
                        <Chip className={rc.className}>{rc.label}</Chip>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => triage(r, "approved")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => triage(r, "needs_fix")}>
                            Needs-fix
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => triage(r, "rejected")}>
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => router.push(`/admin/courses/${encodeURIComponent(r.osmId)}`)}
                          >
                            Open
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        )}
      </div>
    </div>
  );
}
