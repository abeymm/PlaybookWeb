"use client";

import { cn } from "@/lib/utils";
import type { ReviewDoc } from "@/lib/localflow/strategy";

export interface HoleRow { hole: number; shots: number }

/** Left column: holes with par, shot count and flag count; click selects. */
export default function HoleList({ rows, review, selected, onSelect }: { rows: HoleRow[]; review: ReviewDoc | null; selected: number; onSelect: (h: number) => void }) {
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {rows.map((r) => {
        const rh = review?.holes.find((h) => h.hole === r.hole);
        const flags = (rh?.flags?.length ?? 0) + (rh?.shots.reduce((n, s) => n + (s.flags?.length ?? 0), 0) ?? 0);
        return (
          <li key={r.hole}>
            <button
              type="button"
              onClick={() => onSelect(r.hole)}
              className={cn("flex w-full items-center justify-between rounded-md border px-2 py-1 text-left", r.hole === selected ? "border-foreground bg-muted" : "border-border hover:bg-muted/50")}
            >
              <span className="font-medium">Hole {r.hole}</span>
              <span className="text-muted-foreground">par {rh?.par ?? "–"} · {r.shots} shots</span>
              <span className={flags ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>{flags} flag{flags === 1 ? "" : "s"}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
