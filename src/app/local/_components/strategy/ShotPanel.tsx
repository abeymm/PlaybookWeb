"use client";

import { Button } from "@/components/ui/button";
import { hasTarget, shotDistanceYd, type ArchiveNote, type ChangesDoc, type ReviewHole } from "@/lib/localflow/strategy";

const OVERLAP_MIN = 0.005;

/** overlap values are fractions 0..1 (strategy_review.overlap_shares); show the biggest few as whole percents. */
function overlapText(o: Record<string, number> | undefined): string {
  if (!o) return "";
  const vals = Object.entries(o).filter(([, v]) => typeof v === "number" && v > OVERLAP_MIN);
  return vals.sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(" · ");
}

export interface ShotPanelProps {
  hole: number;
  chain: ArchiveNote[];
  reviewHole: ReviewHole | undefined;
  changes: ChangesDoc | null;
  onText: (id: string, text: string) => void;
  onAddLayup: () => void;
  onDeleteLayup: (id: string) => void;
}

/** Right column: the hole's shots in chain order, then its rule changes and rule report. */
export default function ShotPanel({ hole, chain, reviewHole, changes, onText, onAddLayup, onDeleteLayup }: ShotPanelProps) {
  const rowsChanged = (changes?.changes ?? []).filter((c) => c.hole === hole);
  const rules = (changes?.rule_report ?? []).filter((c) => c.hole === hole);
  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">Hole {hole} shots</span>
        <Button size="sm" variant="outline" onClick={onAddLayup}>Add layup</Button>
      </div>
      {reviewHole?.flags?.map((f, i) => <div key={i} className="text-amber-600 dark:text-amber-400">{f.code}: {f.message}</div>)}
      {chain.map((n) => {
        const rs = reviewHole?.shots.find((s) => s.id === n.id);
        const yd = shotDistanceYd(n);
        return (
          <div key={n.id} className="flex flex-col gap-1 rounded-md border border-border p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{n.shotType}</span>
              <span className="text-muted-foreground">{yd != null ? `${Math.round(yd)} yd` : hasTarget(n) ? "" : "green point"}</span>
              {n.shotType === "layup" && <Button size="sm" variant="outline" onClick={() => onDeleteLayup(n.id)}>Delete</Button>}
            </div>
            {rs && <div className="text-muted-foreground">{rs.target_surface ?? ""}{rs.target_surface && rs.overlap ? " — " : ""}{overlapText(rs.overlap)}</div>}
            {rs?.flags?.map((f, i) => <div key={i} className="text-amber-600 dark:text-amber-400">{f.code}: {f.message}</div>)}
            <textarea
              className="min-h-[3.5rem] w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
              value={n.text}
              onChange={(e) => onText(n.id, e.target.value)}
              aria-label={`${n.shotType} text`}
            />
          </div>
        );
      })}
      <div className="flex flex-col gap-1 border-t border-border pt-2">
        <span className="font-medium">Rule changes</span>
        {rowsChanged.length === 0 && rules.length === 0 && <span className="text-muted-foreground">none for this hole</span>}
        {rowsChanged.map((c, i) => (
          <div key={i} className="text-muted-foreground">
            <span className="text-foreground">{c.rule}</span> {c.type} {c.field}: {String(c.before)} → {String(c.after)} — {c.reason}
          </div>
        ))}
        {rules.map((r, i) => <div key={i} className="text-muted-foreground"><span className="text-foreground">{r.rule}</span> {r.status}: {r.detail}</div>)}
      </div>
    </div>
  );
}
