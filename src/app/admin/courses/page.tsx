"use client";

// /admin/courses — AWSCourseIndex browser (Spec §W2.1 + Design Resolutions).
// Default columns: name/location, reviewStatus chip, qc severity, demand. Extra columns togglable.
// Filters: region (geohash prefix), dataTier, reviewStatus, mlgen flags, batchId. Search name/city/state.
// Region-scoped via the region GSI; "all regions" = paginated full list (≤1000/page) with a
// truncation badge. Every async surface has loading/empty/error states (R14).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { PageHeader } from "../_components/PageHeader";
import { Chip, Table, Th, Td } from "../_components/ui";
import { ErrorState, EmptyState, TableSkeleton } from "../_components/states";
import { useAsync } from "../_components/hooks";
import { reviewChip, qcSeverityChip } from "@/lib/coursedata/colors";
import {
  listByRegion,
  listAllCourses,
  playbookDemand,
  type Page,
} from "@/lib/coursedata/api";
import type { CourseIndexRow, ReviewStatus } from "@/lib/coursedata/types";

const REVIEW_STATUSES: ReviewStatus[] = [
  "unreviewed",
  "in_review",
  "needs_fix",
  "approved",
  "rejected",
];

const EXTRA_COLUMNS = [
  { id: "tier", label: "Tier" },
  { id: "counts", label: "Feature counts" },
  { id: "mlgen", label: "mlgen flags" },
  { id: "batch", label: "Batch" },
] as const;
type ExtraCol = (typeof EXTRA_COLUMNS)[number]["id"];

function locationOf(r: CourseIndexRow): string {
  return [r.city, r.state].filter(Boolean).join(", ") || r.country || "—";
}

export default function CoursesPage() {
  const router = useRouter();
  const [region, setRegion] = useState("");
  const [dataTier, setDataTier] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [mlgenFilter, setMlgenFilter] = useState("");
  const [batchId, setBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [extra, setExtra] = useState<Set<ExtraCol>>(new Set());
  const [demand, setDemand] = useState<Record<string, number | null>>({});
  const demandInFlight = useRef<Set<string>>(new Set());

  // Server-side filter (non-key attributes). Key attrs (region/dataTier) drive query choice.
  const serverFilter = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (reviewStatus) f.reviewStatus = { eq: reviewStatus };
    if (mlgenFilter === "available") f.mlgenAvailable = { eq: true };
    if (mlgenFilter === "serveAll") f.mlgenServeAll = { eq: true };
    if (batchId) f.batchId = { eq: batchId };
    if (dataTier && region) f.dataTier = { eq: dataTier };
    return Object.keys(f).length ? f : undefined;
  }, [reviewStatus, mlgenFilter, batchId, dataTier, region]);

  const { data, loading, error, reload } = useAsync<Page<CourseIndexRow>>(
    () =>
      region
        ? listByRegion(region, { filter: serverFilter, limit: 500 })
        : listAllCourses({ filter: serverFilter, limit: 1000 }),
    [region, serverFilter]
  );

  const rows = useMemo(() => {
    let items = data?.items ?? [];
    if (dataTier && !region) items = items.filter((r) => r.dataTier === dataTier);
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter((r) =>
        [r.name, r.city, r.state].some((v) => v?.toLowerCase().includes(q))
      );
    }
    return items;
  }, [data, dataTier, region, search]);

  // Lazily fetch demand per visible row, cached by osmId.
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

  // Fetch demand for the currently visible rows (cap to keep it interactive).
  useEffect(() => {
    for (const r of rows.slice(0, 100)) fetchDemand(r.osmId);
  }, [rows, fetchDemand]);

  const truncated = !region && data?.nextToken;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Courses"
        subtitle="Browse the AWSCourseIndex. Region-scoped queries use the region GSI; all-regions is a capped list."
      />
      <div className="flex flex-wrap items-end gap-2 px-6 py-3">
        <Field label="Region (geohash prefix)">
          <Input
            value={region}
            onChange={(e) => setRegion(e.target.value.trim())}
            placeholder="all regions"
            className="h-8 w-32"
          />
        </Field>
        <Field label="Data tier">
          <select
            value={dataTier}
            onChange={(e) => setDataTier(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Any</option>
            <option value="full">full</option>
            <option value="partial">partial</option>
            <option value="minimal">minimal</option>
          </select>
        </Field>
        <Field label="Review status">
          <select
            value={reviewStatus}
            onChange={(e) => setReviewStatus(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Any</option>
            {REVIEW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="mlgen">
          <select
            value={mlgenFilter}
            onChange={(e) => setMlgenFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Any</option>
            <option value="available">Available</option>
            <option value="serveAll">Serve all</option>
          </select>
        </Field>
        <Field label="Batch">
          <Input
            value={batchId}
            onChange={(e) => setBatchId(e.target.value.trim())}
            placeholder="batchId"
            className="h-8 w-32"
          />
        </Field>
        <Field label="Search name/city/state">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="filter…"
            className="h-8 w-48"
          />
        </Field>
        <div className="ml-auto flex items-center gap-1">
          {EXTRA_COLUMNS.map((c) => (
            <button
              key={c.id}
              onClick={() =>
                setExtra((s) => {
                  const n = new Set(s);
                  if (n.has(c.id)) n.delete(c.id);
                  else n.add(c.id);
                  return n;
                })
              }
              className={
                "rounded-md border px-2 py-1 text-xs " +
                (extra.has(c.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">
        {truncated && (
          <div className="mb-2 flex items-center gap-2">
            <Chip className="border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Truncated — showing first 1000 of the index. Filter by region to narrow.
            </Chip>
          </div>
        )}
        {loading ? (
          <TableSkeleton rows={10} cols={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="No courses match" hint="Try clearing filters or changing the region." />
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">{rows.length} courses</p>
            <Table>
              <thead>
                <tr>
                  <Th>Name / location</Th>
                  <Th>Review</Th>
                  <Th>QC</Th>
                  <Th>Demand</Th>
                  {extra.has("tier") && <Th>Tier</Th>}
                  {extra.has("counts") && <Th>Counts (G/T/F/B/W)</Th>}
                  {extra.has("mlgen") && <Th>mlgen</Th>}
                  {extra.has("batch") && <Th>Batch</Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rc = reviewChip(r.reviewStatus);
                  const qc = qcSeverityChip(r.qcErrors, r.qcWarnings);
                  const dem = demand[r.osmId];
                  return (
                    <tr
                      key={r.osmId}
                      onClick={() => router.push(`/admin/courses/${encodeURIComponent(r.osmId)}`)}
                      className="cursor-pointer hover:bg-muted/40"
                    >
                      <Td>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{locationOf(r)}</div>
                      </Td>
                      <Td>
                        <Chip className={rc.className}>{rc.label}</Chip>
                      </Td>
                      <Td>
                        <Chip className={qc.className}>{qc.label}</Chip>
                      </Td>
                      <Td>
                        <DemandCell value={dem} />
                      </Td>
                      {extra.has("tier") && <Td className="text-xs">{r.dataTier}</Td>}
                      {extra.has("counts") && (
                        <Td className="text-xs tabular-nums">
                          {[r.greenCount, r.teeCount, r.fairwayCount, r.bunkerCount, r.waterCount]
                            .map((n) => n ?? "–")
                            .join(" / ")}
                        </Td>
                      )}
                      {extra.has("mlgen") && (
                        <Td className="text-xs">
                          {r.mlgenServeAll ? "serve-all" : r.mlgenAvailable ? "available" : "—"}
                        </Td>
                      )}
                      {extra.has("batch") && <Td className="text-xs">{r.batchId ?? "—"}</Td>}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function DemandCell({ value }: { value: number | null | undefined }) {
  if (value === undefined) return <span className="text-xs text-muted-foreground">…</span>;
  if (value === null) return <span className="text-xs text-muted-foreground">?</span>;
  return <span className="tabular-nums">{value}</span>;
}
