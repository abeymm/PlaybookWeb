"use client";

// SeedLanding — lists saved seeds (from S3 seeds/) + a "New seed" button. Clicking a seed opens it
// in the editor for fixing. Each row shows the course name (read from the seed JSON), key, hole
// count, and last-modified.

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "../../_components/PageHeader";
import { Table, Th, Td } from "../../_components/ui";
import { ErrorState, EmptyState, TableSkeleton } from "../../_components/states";
import { useAsync } from "../../_components/hooks";
import { Button } from "@/components/ui/button";
import { listSeeds, downloadSeed } from "@/lib/coursedata/api";
import { draftFromSeed, type SeedDraft, type SeedJson } from "@/lib/coursedata/seed";

interface SeedRow {
  key: string;
  name: string;
  holeCount: number | null;
  lastModified?: Date;
  seed: SeedJson | null;
}

async function loadSeedRows(): Promise<SeedRow[]> {
  const objs = (await listSeeds()).filter((o) => o.path.endsWith(".json"));
  const rows = await Promise.all(
    objs.map(async (o): Promise<SeedRow> => {
      const fallbackName = (o.path.split("/").pop() ?? o.path).replace(/\.json$/, "");
      try {
        const seed = await downloadSeed(o.path);
        return {
          key: o.path,
          name: seed.name || fallbackName,
          holeCount: seed.holeCount ?? seed.holes?.length ?? null,
          lastModified: o.lastModified,
          seed,
        };
      } catch {
        return { key: o.path, name: fallbackName, holeCount: null, lastModified: o.lastModified, seed: null };
      }
    })
  );
  return rows.sort((a, b) => a.key.localeCompare(b.key));
}

export interface SeedLandingProps {
  onNew: () => void;
  onOpen: (draft: SeedDraft, key: string) => void;
}

export default function SeedLanding({ onNew, onOpen }: SeedLandingProps) {
  const { data, loading, error, reload } = useAsync<SeedRow[]>(loadSeedRows, []);
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  async function open(row: SeedRow) {
    setOpeningKey(row.key);
    try {
      const seed = row.seed ?? (await downloadSeed(row.key));
      onOpen(draftFromSeed(seed), row.key);
    } catch {
      setOpeningKey(null);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Seed"
        subtitle="Hand-click tee/green locations to seed a brand-new course."
        actions={
          <Button size="sm" onClick={onNew} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New seed
          </Button>
        }
      />
      <div className="px-6 py-4">
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No seeds yet"
            hint="Click “New seed” to hand-click a course from NAIP imagery."
          />
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">{data!.length} seeds</p>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Key</Th>
                  <Th>Holes</Th>
                  <Th>Modified</Th>
                </tr>
              </thead>
              <tbody>
                {data!.map((row) => (
                  <tr
                    key={row.key}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => open(row)}
                  >
                    <Td className="font-medium">
                      {row.name}
                      {openingKey === row.key && (
                        <span className="ml-2 text-xs text-muted-foreground">opening…</span>
                      )}
                    </Td>
                    <Td className="font-mono text-xs">{row.key}</Td>
                    <Td className="text-xs tabular-nums">{row.holeCount ?? "—"}</Td>
                    <Td className="text-xs">
                      {row.lastModified ? new Date(row.lastModified).toLocaleString() : "—"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </div>
    </div>
  );
}
