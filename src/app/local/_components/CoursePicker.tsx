"use client";

// CoursePicker — search the local OSM cohort by name (or key) and pick a course. Centerline-ready
// (`full`) courses are the ones the pipeline can run; the rest are listed but not selectable.
// Rows link to /local/course/<key> (the per-course page owns status/generate/scorecard/map/export).

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Chip, Table, Th, Td } from "@/app/admin/_components/ui";
import { cn } from "@/lib/utils";
import type { CohortEntry, GeneratedEntry, ReviewStatus } from "@/lib/localflow/types";

function courseHref(courseKey: string): string {
  return `/local/course/${encodeURIComponent(courseKey)}`;
}

type GroupBy = "none" | "state" | "status";

const GROUP_BY_STORAGE_KEY = "playbook.local.groupBy";

function isGroupBy(v: unknown): v is GroupBy {
  return v === "none" || v === "state" || v === "status";
}

const STATUS_ORDER: ReviewStatus[] = ["clean", "needs-review", "fragment", "invalid"];

const STATUS_LEGEND: Record<ReviewStatus, string> = {
  clean: "generated, validated, no anomalies",
  "needs-review": "generated and valid, but the report flagged one or more anomalies",
  fragment: "a split-off fragment of another course, or otherwise excluded from serving",
  invalid: "generated JSON exists but no validator report was produced",
};

const STATUS_CHIP_CLASS: Record<ReviewStatus, string> = {
  clean: "border-emerald-300 text-emerald-700 dark:text-emerald-300",
  "needs-review": "border-amber-300 text-amber-700 dark:text-amber-300",
  fragment: "border-sky-300 text-sky-700 dark:text-sky-300",
  invalid: "border-destructive/40 text-destructive",
};

interface GroupSectionData {
  key: string;
  label: string;
  rows: GeneratedEntry[];
}

/** Buckets rows by state (alphabetical, "—" for missing, last) or status (fixed triage order). */
function buildSections(rows: GeneratedEntry[], groupBy: "state" | "status"): GroupSectionData[] {
  const map = new Map<string, GeneratedEntry[]>();
  for (const row of rows) {
    const label = groupBy === "state" ? (row.state ?? "—") : row.status;
    const bucket = map.get(label);
    if (bucket) bucket.push(row);
    else map.set(label, [row]);
  }
  const labels = [...map.keys()];
  if (groupBy === "status") {
    labels.sort((a, b) => STATUS_ORDER.indexOf(a as ReviewStatus) - STATUS_ORDER.indexOf(b as ReviewStatus));
  } else {
    labels.sort((a, b) => {
      if (a === "—") return 1;
      if (b === "—") return -1;
      return a.localeCompare(b);
    });
  }
  return labels.map((label) => ({ key: label, label, rows: map.get(label)! }));
}

/** The generated-list table body, capped at 300 rows with a "showing N of M" footer past that. */
function GeneratedRowsTable({ rows }: { rows: GeneratedEntry[] }) {
  const capped = rows.slice(0, 300);
  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>State</Th>
            <Th>Key</Th>
            <Th>Holes</Th>
            <Th>Generated</Th>
            <Th>Validator</Th>
            <Th>Issues</Th>
          </tr>
        </thead>
        <tbody>
          {capped.map((g) => (
            <tr key={g.courseKey} className="hover:bg-muted/40">
              <Td className="font-medium">
                <Link href={courseHref(g.courseKey)} className="block hover:underline">
                  {g.name}
                </Link>
              </Td>
              <Td className="text-xs">{g.state ?? "—"}</Td>
              <Td className="font-mono text-xs">{g.courseKey}</Td>
              <Td className="text-xs tabular-nums">{g.holeCount}</Td>
              <Td className="text-xs">{g.generatedAt.slice(0, 16).replace("T", " ")}</Td>
              <Td>
                <Chip className={g.valid ? "border-emerald-300 text-emerald-700 dark:text-emerald-300" : "border-amber-300 text-amber-700 dark:text-amber-300"}>
                  {g.valid ? "valid" : "invalid"}
                </Chip>
              </Td>
              <Td className="text-xs text-muted-foreground">{g.anomalies.join(", ")}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {rows.length > 300 && (
        <p className="mt-1 text-xs text-muted-foreground">showing 300 of {rows.length} — type to narrow</p>
      )}
    </>
  );
}

/** One collapsible group section: header "<label> (count)", rows shown only while expanded. */
function GroupSection({
  section,
  groupBy,
  expanded,
  onToggle,
}: {
  section: GroupSectionData;
  groupBy: GroupBy;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-2 rounded-lg border border-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-muted/40"
      >
        <span className="text-muted-foreground">{expanded ? "▾" : "▸"}</span>
        {groupBy === "status" ? (
          <Chip className={STATUS_CHIP_CLASS[section.label as ReviewStatus]}>{section.label}</Chip>
        ) : (
          <span>{section.label}</span>
        )}
        <span className="text-muted-foreground">({section.rows.length})</span>
      </button>
      {expanded && (
        <div className="max-h-64 overflow-auto border-t border-border px-2 py-2">
          <GeneratedRowsTable rows={section.rows} />
        </div>
      )}
    </div>
  );
}

export default function CoursePicker() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CohortEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  // Generated-courses list: shown (and filtered by the query) until the user switches to cohort search.
  const [generated, setGenerated] = useState<GeneratedEntry[] | null>(null);
  const [generatedTotal, setGeneratedTotal] = useState(0);
  const [browseGenerated, setBrowseGenerated] = useState(true);
  const [groupBy, setGroupByState] = useState<GroupBy>("none");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(GROUP_BY_STORAGE_KEY);
      if (isGroupBy(saved)) setGroupByState(saved);
    } catch {
      /* localStorage unavailable (private mode, etc.) — fall back to the "none" default */
    }
  }, []);

  const setGroupBy = (next: GroupBy) => {
    setGroupByState(next);
    try {
      window.localStorage.setItem(GROUP_BY_STORAGE_KEY, next);
    } catch {
      /* best effort */
    }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/local/api/generated");
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? res.statusText);
        if (!cancelled) {
          setGenerated(body.items);
          setGeneratedTotal(body.total);
          if (body.total === 0) setBrowseGenerated(false);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q || browseGenerated) {
      setItems([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/local/api/search?q=${encodeURIComponent(q)}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? res.statusText);
        setItems(body.items);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, browseGenerated]);

  const q = query.trim().toLowerCase();
  const filterActive = q.length > 0;
  const generatedRows = browseGenerated
    ? (generated ?? []).filter((g) => !q || g.name.toLowerCase().includes(q) || g.courseKey.toLowerCase().includes(q))
    : [];
  const sections = groupBy === "none" ? [] : buildSections(generatedRows, groupBy);

  return (
    <section className="border-b border-border px-6 py-4">
      <div className="flex items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Course name or cache key
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="crosswater"
            className="h-8 w-80"
            aria-label="Search the local OSM cohort"
          />
        </label>
        <label className="flex items-center gap-1 pb-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={browseGenerated}
            onChange={(e) => setBrowseGenerated(e.target.checked)}
            aria-label="Browse generated courses"
          />
          generated only{generated ? ` (${generatedTotal})` : ""}
        </label>
        {browseGenerated && (
          <label className="flex items-center gap-1 pb-2 text-xs text-muted-foreground">
            group by
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              aria-label="Group the generated list by"
              className="h-7 rounded-md border border-border bg-background px-1.5 text-xs"
            >
              <option value="none">none</option>
              <option value="state">state</option>
              <option value="status">status</option>
            </select>
          </label>
        )}
        {searching && <span className="pb-2 text-xs text-muted-foreground">searching…</span>}
        {error && <span className="pb-2 text-xs text-destructive">{error}</span>}
      </div>
      {browseGenerated && groupBy === "status" && generatedRows.length > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          clean — {STATUS_LEGEND.clean} · needs-review — {STATUS_LEGEND["needs-review"]} · fragment —{" "}
          {STATUS_LEGEND.fragment} · invalid — {STATUS_LEGEND.invalid}
        </p>
      )}
      {browseGenerated && groupBy === "none" && generatedRows.length > 0 && (
        <div className="mt-3 max-h-64 overflow-auto">
          <GeneratedRowsTable rows={generatedRows} />
        </div>
      )}
      {browseGenerated && groupBy !== "none" && sections.length > 0 && (
        <div className="mt-1">
          {sections.map((section) => {
            const key = `${groupBy}:${section.label}`;
            return (
              <GroupSection
                key={key}
                section={section}
                groupBy={groupBy}
                expanded={filterActive || expandedGroups.has(key)}
                onToggle={() => toggleGroup(key)}
              />
            );
          })}
        </div>
      )}
      {!browseGenerated && items.length > 0 && (
        <div className="mt-3 max-h-64 overflow-auto">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>State</Th>
                <Th>Key</Th>
                <Th>Holes</Th>
                <Th>Centerlines</Th>
                <Th>Tier</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const ready = it.tier === "full" && !it.malformed;
                return (
                  <tr
                    key={it.courseKey}
                    className={cn(ready ? "hover:bg-muted/40" : "opacity-50")}
                    title={ready ? undefined : "not centerline-ready — the pipeline needs an OSM centerline on every hole"}
                  >
                    <Td className="font-medium">
                      {ready ? (
                        <Link href={courseHref(it.courseKey)} className="block hover:underline">
                          {it.name}
                        </Link>
                      ) : (
                        it.name
                      )}
                    </Td>
                    <Td className="text-xs">{it.state ?? "—"}</Td>
                    <Td className="font-mono text-xs">{it.courseKey}</Td>
                    <Td className="text-xs tabular-nums">{it.holeCount}</Td>
                    <Td className="text-xs tabular-nums">{it.centerlineHoles}</Td>
                    <Td>
                      <Chip className={ready ? "border-emerald-300 text-emerald-700 dark:text-emerald-300" : ""}>
                        {it.malformed ? "malformed" : it.tier}
                      </Chip>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </section>
  );
}
