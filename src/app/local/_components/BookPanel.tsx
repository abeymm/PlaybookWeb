"use client";

// BookPanel — the 40-page print book for a generated course: options, Build (spawns
// core/print_book.py via /local/api/book), then each run's summary, contact sheet, PDF link,
// review table (owner_ok per hole) and the Release button (enabled only when every row is yes).

import { useCallback, useEffect, useState } from "react";
import RunPanel from "./RunPanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Chip } from "@/app/admin/_components/ui";
import type { BookStatusResponse, RunSummary } from "@/lib/localflow/bookTypes";

const POLL_MS = 2000;
type Marks = Record<string, string>;
interface ReviewView { columns: string[]; rows: Record<string, string>[]; allOk: boolean }

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `${res.status} ${res.statusText}`);
  return body as T;
}

const fileUrl = (key: string, runId: string, name: string) =>
  `/local/api/book/${encodeURIComponent(key)}/runs/${runId}/file?name=${encodeURIComponent(name)}`;

const inputCls = "rounded-md border border-border bg-background px-2 py-1 text-xs";

function ReviewTable({ courseKey, run, onReleased }: { courseKey: string; run: RunSummary; onReleased: () => void }) {
  const base = `/local/api/book/${encodeURIComponent(courseKey)}/runs/${run.runId}`;
  const [review, setReview] = useState<ReviewView | null>(null);
  const [marks, setMarks] = useState<Marks>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await getJson<ReviewView>(`${base}/review`);
      setReview(r);
      setMarks(Object.fromEntries(r.rows.map((row) => [row.hole, (row.owner_ok ?? "").trim().toLowerCase()])));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [base]);
  useEffect(() => { void load(); }, [load]);

  if (!review) {
    return err
      ? <div className="text-xs text-destructive">{err}</div>
      : <div className="text-xs text-muted-foreground">loading review…</div>;
  }

  const saved = Object.fromEntries(review.rows.map((r) => [r.hole, (r.owner_ok ?? "").trim().toLowerCase()]));
  const dirty = review.rows.some((r) => (marks[r.hole] ?? "") !== saved[r.hole]);
  const shown = review.columns.filter((c) => c !== "owner_ok" && c !== "build_id");

  const save = async () => {
    setBusy(true);
    try {
      const r = await getJson<ReviewView>(`${base}/review`, {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ marks }),
      });
      setReview(r);
      setMarks(Object.fromEntries(r.rows.map((row) => [row.hole, (row.owner_ok ?? "").trim().toLowerCase()])));
      setMsg("saved");
      setErr(null);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };
  const release = async () => {
    setBusy(true);
    try {
      const r = await getJson<{ path: string }>(`${base}/release`, { method: "POST" });
      setMsg(`released → ${r.path}`);
      setErr(null);
      onReleased();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };
  const setAll = (v: string) => setMarks(Object.fromEntries(review.rows.map((r) => [r.hole, v])));

  return (
    <div className="flex flex-col gap-2">
      {err && <div className="rounded-md border border-red-300 px-2 py-1 text-xs text-destructive">{err}</div>}
      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-muted/40">
            <tr>
              {shown.map((c) => <th key={c} className="px-2 py-1 font-medium">{c}</th>)}
              <th className="px-2 py-1 font-medium">owner_ok</th>
            </tr>
          </thead>
          <tbody>
            {review.rows.map((row) => (
              <tr key={row.hole} className="border-t border-border align-top">
                {shown.map((c) => <td key={c} className="px-2 py-1">{row[c]}</td>)}
                <td className="px-2 py-1">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={(marks[row.hole] ?? "").trim().toLowerCase() === "yes"}
                      onChange={(e) => setMarks({ ...marks, [row.hole]: e.target.checked ? "yes" : "" })}
                    />
                    yes
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Button size="sm" variant="outline" onClick={() => setAll("yes")} disabled={busy}>Mark all yes</Button>
        <Button size="sm" onClick={save} disabled={busy || !dirty}>Save review</Button>
        <Button size="sm" onClick={release} disabled={busy || dirty || !review.allOk || run.released}>
          {run.released ? "Released" : "Release PDF"}
        </Button>
        {dirty && <span className="text-amber-600 dark:text-amber-400">unsaved marks</span>}
        {!review.allOk && !dirty && <span className="text-muted-foreground">release needs owner_ok = yes on every row</span>}
        {msg && <span className="text-emerald-700 dark:text-emerald-300">{msg}</span>}
      </div>
    </div>
  );
}

function RunCard({ courseKey, run, defaultOpen, onChanged }: { courseKey: string; run: RunSummary; defaultOpen: boolean; onChanged: () => void }) {
  const ok = run.status === "ok";
  return (
    <details open={defaultOpen} className="rounded-md border border-border p-2">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-xs">
        <span className="font-mono">{run.runId}</span>
        <Chip className={ok ? "border-emerald-300 text-emerald-700 dark:text-emerald-300" : "border-red-300 text-red-700 dark:text-red-300"}>
          {run.status}{run.failedStage ? ` @ ${run.failedStage}` : ""}
        </Chip>
        {run.buildId && <span>build {run.buildId}{run.revision != null ? ` r${run.revision}` : ""}</span>}
        {run.pages != null && <span>{run.pages} pages</span>}
        {run.marginViolations != null && <span>{run.marginViolations} margin violations</span>}
        <span>{run.warnings.length} warnings</span>
        {run.released && <Chip className="border-emerald-300 text-emerald-700 dark:text-emerald-300">released</Chip>}
        {run.hasEdited && <Chip className="border-amber-300 text-amber-700 dark:text-amber-300">edited plan</Chip>}
      </summary>
      <div className="mt-2 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 text-xs">
          {run.hasPdf && <a className="underline" href={fileUrl(courseKey, run.runId, "render-book-vivid/book.pdf")} target="_blank" rel="noreferrer">Open PDF</a>}
          <a className="underline" href={fileUrl(courseKey, run.runId, "book.log")} target="_blank" rel="noreferrer">log</a>
          <a className="underline" href={fileUrl(courseKey, run.runId, "run.json")} target="_blank" rel="noreferrer">run.json</a>
          <a className="underline" href={fileUrl(courseKey, run.runId, "tees/tee-check.md")} target="_blank" rel="noreferrer">tee check</a>
          <a className="underline" href={fileUrl(courseKey, run.runId, "strategy/review-final.md")} target="_blank" rel="noreferrer">strategy review</a>
          {run.hasStrategy && (
            <Link className="underline" href={`/local/course/${encodeURIComponent(courseKey)}/strategy/${run.runId}`}>Review strategy</Link>
          )}
          {run.qrTarget && <span className="text-muted-foreground">QR → {run.qrTarget}</span>}
        </div>
        {run.warnings.length > 0 && (
          <ul className="list-disc pl-5 text-[11px] text-amber-700 dark:text-amber-300">
            {run.warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
        {run.hasContact && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(courseKey, run.runId, "render-book-vivid/contact-sheet.png")} alt="contact sheet" className="max-h-[480px] w-auto rounded-md border border-border" />
        )}
        {run.hasReview && ok && <ReviewTable courseKey={courseKey} run={run} onReleased={onChanged} />}
      </div>
    </details>
  );
}

export default function BookPanel({ courseKey, generatedExists, onError }: { courseKey: string; generatedExists: boolean; onError: (m: string) => void }) {
  const [st, setSt] = useState<BookStatusResponse | null>(null);
  const [variant, setVariant] = useState("strategy");
  const [edition, setEdition] = useState("2027");
  const [handicap, setHandicap] = useState("low");
  const [primaryTee, setPrimaryTee] = useState("auto");
  const [apiId, setApiId] = useState("");

  const refresh = useCallback(async () => {
    try {
      const s = await getJson<BookStatusResponse>(`/local/api/book/${encodeURIComponent(courseKey)}`);
      setSt(s);
      setApiId((cur) => cur || s.golfapiCourseId || "");
    } catch (e) { onError(e instanceof Error ? e.message : String(e)); }
  }, [courseKey, onError]);
  useEffect(() => {
    // Deferred so the fetch's setState never runs synchronously inside the effect body.
    const t = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t);
  }, [refresh, generatedExists]);

  const running = st?.job?.status === "running";
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [running, refresh]);

  const build = async () => {
    try {
      await getJson(`/local/api/book/${encodeURIComponent(courseKey)}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ variant, edition, handicap, primaryTee: primaryTee.trim() || "auto", golfapiCourseId: apiId.trim() }),
      });
    } catch (e) { onError(e instanceof Error ? e.message : String(e)); }
    void refresh();
  };

  const needsSecret = variant === "strategy" && st != null && !st.secretAvailable;
  return (
    <RunPanel
      title="Print book (40 pages)"
      hint={`core/print_book.py on the generated JSON → ${st?.printDir ?? "<run dir>/print/<run id>"}`}
      view={st ? { job: st.job, logTail: st.logTail } : null}
      actionLabel="Build book"
      actionDisabled={!st || !st.canBuild || !generatedExists || !apiId.trim() || needsSecret}
      onAction={build}
    >
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-1">variant
          <select className={inputCls} value={variant} onChange={(e) => setVariant(e.target.value)}>
            <option value="strategy">strategy</option><option value="plain">plain</option>
          </select>
        </label>
        <label className="flex items-center gap-1">edition
          <input className={`${inputCls} w-16`} value={edition} onChange={(e) => setEdition(e.target.value)} />
        </label>
        <label className="flex items-center gap-1">handicap
          <select className={inputCls} value={handicap} onChange={(e) => setHandicap(e.target.value)}>
            <option value="low">low</option><option value="medium">medium</option><option value="high">high</option>
          </select>
        </label>
        <label className="flex items-center gap-1">primary tee
          <input className={`${inputCls} w-28`} value={primaryTee} onChange={(e) => setPrimaryTee(e.target.value)} placeholder="auto" />
        </label>
        <label className="flex items-center gap-1">GolfAPI id
          <input className={`${inputCls} w-52 font-mono`} value={apiId} onChange={(e) => setApiId(e.target.value)}
            placeholder={st?.golfapiCourseId ? "" : "not found — type it"} />
        </label>
      </div>
      {needsSecret && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          No id secret: set PLAYBOOK_ID_SECRET or add the Keychain item playbook-id-secret (needed for the strategy variant).
        </div>
      )}
      {st && !st.canBuild && <div className="text-xs text-muted-foreground">Generate the course first.</div>}
      {st && st.runs.length > 0 && (
        <div className="flex flex-col gap-2">
          {st.runs.map((r, i) => (
            <RunCard key={r.runId} courseKey={courseKey} run={r} defaultOpen={i === 0} onChanged={() => void refresh()} />
          ))}
        </div>
      )}
    </RunPanel>
  );
}
