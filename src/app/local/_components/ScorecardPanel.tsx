"use client";

// ScorecardPanel — attach an OpenGolfAPI scorecard (ODbL) to the selected course: search by name
// near the course centre, preview the normalized card, apply. Apply merges into the input copy
// (so a (re)generation sees real pars and tee lengths) and into the generated JSON when present.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip, Table, Th, Td } from "@/app/admin/_components/ui";
import { cn } from "@/lib/utils";
import type { Scorecard, ScorecardCandidate } from "@/lib/localflow/types";
import type { ScorecardQuality } from "@/lib/localflow/scorecard";

export interface ScorecardPanelProps {
  courseKey: string;
  courseName: string;
  center: { lat: number; lng: number } | null;
  attached: { source: string; id: string } | null;
  /** True while the editor has unsaved changes — applying would clobber them. */
  blocked: boolean;
  generatedExists: boolean;
  /** Hole count of the course, for the card-quality check. */
  holeCount: number;
  onApplied: () => void;
}

interface ApplyResponse {
  ok: boolean;
  error?: string;
  scorecard?: { name: string; parTotal: number | null; holes: number; tees: number };
  input?: { changes: string[]; skipped: string[]; checks: number };
  generated?: { changes: string[]; skipped: string[]; findings: { level: string; path: string; msg: string }[]; written: boolean; checks: number } | null;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `${res.status} ${res.statusText}`);
  return body as T;
}

export default function ScorecardPanel(props: ScorecardPanelProps) {
  const { courseKey, courseName, center, attached, blocked, generatedExists, holeCount, onApplied } = props;
  const [query, setQuery] = useState(courseName);
  const [items, setItems] = useState<ScorecardCandidate[]>([]);
  const [selected, setSelected] = useState<ScorecardCandidate | null>(null);
  const [preview, setPreview] = useState<Scorecard | null>(null);
  const [quality, setQuality] = useState<ScorecardQuality | null>(null);
  const [busy, setBusy] = useState<"search" | "preview" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplyResponse | null>(null);

  useEffect(() => {
    setQuery(courseName);
    setItems([]);
    setSelected(null);
    setPreview(null);
    setResult(null);
    setError(null);
  }, [courseKey, courseName]);

  const search = async () => {
    setBusy("search");
    setError(null);
    try {
      const params = new URLSearchParams({ q: query.trim() });
      if (center) {
        params.set("lat", String(center.lat));
        params.set("lng", String(center.lng));
        params.set("radius_mi", "25");
      }
      const body = await getJson<{ items: ScorecardCandidate[] }>(`/local/api/scorecard/search?${params}`);
      setItems(body.items);
      if (body.items.length === 0) setError("no OpenGolfAPI course matched — try a shorter name or drop the club name");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const pick = async (c: ScorecardCandidate) => {
    setSelected(c);
    setPreview(null);
    setResult(null);
    setBusy("preview");
    try {
      const body = await getJson<{ scorecard: Scorecard; quality: ScorecardQuality }>(
        `/local/api/scorecard/course/${encodeURIComponent(c.id)}?holes=${holeCount}`
      );
      setPreview(body.scorecard);
      setQuality(body.quality);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const apply = async () => {
    if (!selected) return;
    setBusy("apply");
    try {
      const body = await getJson<ApplyResponse>(`/local/api/scorecard/apply/${encodeURIComponent(courseKey)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });
      setResult(body);
      setError(null);
      onApplied();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="flex flex-col gap-2 border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div>
          <div className="text-sm font-semibold">Scorecard — OpenGolfAPI</div>
          <div className="text-xs text-muted-foreground">
            par · handicap · yardage per tee · rating/slope (ODbL). Cross-check: fills what is missing, never overwrites, records disagreements as checks. Applied to the input copy
            {generatedExists ? " and the generated course" : ""}; regenerate to feed per-tee centerlines.
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          {attached ? (
            <Chip className="border-emerald-300 text-emerald-700 dark:text-emerald-300">attached · {attached.id.slice(0, 8)}</Chip>
          ) : (
            <Chip>none attached</Chip>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void search()}
          placeholder="course name"
          className="h-8 w-80"
          aria-label="Search OpenGolfAPI"
        />
        <Button size="sm" variant="outline" onClick={() => void search()} disabled={busy !== null || !query.trim()}>
          {busy === "search" ? "Searching…" : center ? "Search near course" : "Search"}
        </Button>
        {selected && (
          <Button size="sm" onClick={() => void apply()} disabled={busy !== null || blocked || !preview}
            title={blocked ? "save your edits first" : undefined}>
            {busy === "apply" ? "Applying…" : `Apply ${selected.name}`}
          </Button>
        )}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
      {items.length > 0 && (
        <Table>
          <thead>
            <tr><Th>Name</Th><Th>City</Th><Th>State</Th><Th>Par</Th><Th>Type</Th><Th>Distance</Th></tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} onClick={() => void pick(c)}
                className={cn("cursor-pointer hover:bg-muted/40", selected?.id === c.id && "bg-primary/10")}>
                <Td className="font-medium">{c.name}</Td>
                <Td className="text-xs">{c.city ?? "—"}</Td>
                <Td className="text-xs">{c.state ?? "—"}</Td>
                <Td className="text-xs tabular-nums">{c.par ?? "—"}</Td>
                <Td className="text-xs">{c.type ?? "—"}</Td>
                <Td className="text-xs tabular-nums">{c.distanceMi != null ? `${c.distanceMi.toFixed(1)} mi` : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {preview && (
        <div className="rounded-md border border-border bg-muted/30 p-2 text-xs">
          <div className="mb-1 font-medium">
            {preview.name} · par {preview.parTotal ?? "?"} · {preview.holes.length} holes · {preview.tees.length} tees
            {preview.tees[0] && ` · ${preview.tees[0].name} ${preview.tees[0].totalYards} yd`}
          </div>
          <div className="font-mono">
            pars: {preview.holes.map((h) => h.par ?? "?").join(" ")}
          </div>
          <div className="font-mono text-muted-foreground">
            hcp:  {preview.holes.map((h) => h.handicap ?? "?").join(" ")}
          </div>
          {quality && quality.warnings.length > 0 && (
            <ul className="mt-1 text-amber-600 dark:text-amber-400">
              {quality.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
            </ul>
          )}
          <div className="mt-1 text-[11px] text-muted-foreground">{preview.attribution}</div>
        </div>
      )}
      {result && (
        <div className="rounded-md border border-border p-2 text-xs">
          <div className="font-medium">
            {result.ok ? "Applied" : "Applied to input only"} — {result.scorecard?.name}
          </div>
          <div className="text-muted-foreground">
            input: {result.input?.changes.length ?? 0} changes, {result.input?.checks ?? 0} checks
            {result.generated && ` · generated: ${result.generated.changes.length} changes, ${result.generated.checks} checks${result.generated.written ? "" : " (NOT written — validation errors)"}`}
            {" "}— nothing existing was overwritten; open items are listed in the Checks tab of the course view
          </div>
          {result.generated && !result.generated.written && (
            <ul className="mt-1 text-destructive">
              {result.generated.findings.filter((f) => f.level === "error").slice(0, 8).map((f, i) => (
                <li key={i}><code className="font-mono">{f.path}</code> {f.msg}</li>
              ))}
            </ul>
          )}
          {(result.input?.skipped.length ?? 0) > 0 && (
            <div className="mt-1 text-amber-600 dark:text-amber-400">{result.input!.skipped.join(" · ")}</div>
          )}
        </div>
      )}
    </section>
  );
}
