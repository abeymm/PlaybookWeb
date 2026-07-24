"use client";

// HoleRail — ordered list of holes with capture status, a par stepper (3–6, default unset),
// add/delete, and selection (which re-centers the map on that hole via the parent).
//
// Renumbering: adding a hole picks max(number)+1; deleting leaves the rest untouched (gaps allowed —
// the pipeline tolerates them, so we do NOT force contiguity).

import { PlusIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SeedHole } from "@/lib/coursedata/seed";

const PARS = [3, 4, 5, 6] as const;

function status(hole: SeedHole): { label: string; className: string } {
  const n = hole.points.length;
  if (n === 0) return { label: "empty", className: "text-muted-foreground" };
  if (n === 1) return { label: "tee only", className: "text-amber-600 dark:text-amber-400" };
  return { label: `${n} pts`, className: "text-emerald-600 dark:text-emerald-400" };
}

export interface HoleRailProps {
  holes: SeedHole[];
  activeIdx: number;
  onSelect: (i: number) => void;
  onAddHole: () => void;
  onDeleteHole: (i: number) => void;
  onSetPar: (i: number, par: number | undefined) => void;
}

export default function HoleRail(props: HoleRailProps) {
  const { holes, activeIdx } = props;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Holes ({holes.length})
        </span>
        <Button size="sm" variant="outline" onClick={props.onAddHole} className="h-7 gap-1 px-2">
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {holes.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">No holes yet — add one to start.</p>
        ) : (
          <ul>
            {holes.map((hole, i) => {
              const active = i === activeIdx;
              const st = status(hole);
              return (
                <li
                  key={i}
                  className={cn(
                    "border-b border-border/60 px-3 py-2",
                    active ? "bg-primary/10" : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      className="flex flex-1 items-center gap-2 text-left"
                      onClick={() => props.onSelect(i)}
                      aria-current={active ? "true" : undefined}
                    >
                      <span className="text-sm font-medium">Hole {hole.holeNumber}</span>
                      <span className={cn("text-xs", st.className)}>{st.label}</span>
                    </button>
                    <button
                      aria-label={`Delete hole ${hole.holeNumber}`}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                      onClick={() => props.onDeleteHole(i)}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="mr-1 text-[11px] text-muted-foreground">Par</span>
                    {PARS.map((p) => {
                      const on = hole.par === p;
                      return (
                        <button
                          key={p}
                          onClick={() => props.onSetPar(i, on ? undefined : p)}
                          className={cn(
                            "h-6 w-6 rounded border text-xs tabular-nums",
                            on
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          )}
                          title={on ? "Click to clear par" : `Set par ${p}`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    {hole.par === undefined && (
                      <span className="ml-1 text-[11px] text-muted-foreground">unset</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
