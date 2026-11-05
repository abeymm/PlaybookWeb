"use client";

// /admin/storage — prefix browser (Spec §W2.5 + E13/N3/N4).
// Prefixes: public/osm-cache/ (read-only), public/osm-cache-mlgen/ (staging/ excluded),
// qc-reports/. Delete routes THROUGH the editor Lambda deleteCourseArtifact (never client
// remove()); delete disabled+explained on the legacy prefix (AC #10).

import { Fragment, useMemo, useState } from "react";
import { PageHeader } from "../_components/PageHeader";
import { Chip, Table, Th, Td, Dialog } from "../_components/ui";
import { ErrorState, EmptyState, TableSkeleton } from "../_components/states";
import { useAsync } from "../_components/hooks";
import { Button } from "@/components/ui/button";
import {
  listStorage,
  deleteCourseArtifact,
  objectProperties,
  PREFIX,
  type StorageObject,
} from "@/lib/coursedata/api";

const PREFIXES = [
  { id: PREFIX.legacy, label: "osm-cache (legacy)", deletable: false },
  { id: PREFIX.mlgen, label: "osm-cache-mlgen", deletable: true },
  { id: PREFIX.reports, label: "qc-reports", deletable: true },
] as const;

function fmtBytes(n?: number): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StoragePage() {
  const [prefix, setPrefix] = useState<string>(PREFIX.mlgen);
  const [toDelete, setToDelete] = useState<StorageObject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [metaFor, setMetaFor] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, string> | null>(null);

  const current = PREFIXES.find((p) => p.id === prefix)!;
  const { data, loading, error, reload } = useAsync<StorageObject[]>(
    () => listStorage(prefix),
    [prefix]
  );
  const rows = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.path.localeCompare(b.path)),
    [data]
  );

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteCourseArtifact(toDelete.path);
      if (!res.ok) {
        setDeleteError(res.error ?? "Delete rejected by server.");
        return;
      }
      setToDelete(null);
      reload();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  }

  async function showMeta(path: string) {
    setMetaFor(path);
    setMeta(null);
    try {
      const props = await objectProperties(path);
      setMeta((props.metadata as Record<string, string>) ?? {});
    } catch {
      setMeta({});
    }
  }

  async function download(path: string) {
    const { downloadData } = await import("aws-amplify/storage");
    const { body } = await downloadData({ path }).result;
    const blob = await body.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() ?? "download";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Storage" subtitle="Browse and manage courseData artifacts in S3." />
      <div className="flex items-center gap-1 px-6 py-3">
        {PREFIXES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPrefix(p.id)}
            className={
              "rounded-md border px-3 py-1.5 text-sm " +
              (prefix === p.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted")
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="px-6 pb-8">
        {!current.deletable && (
          <p className="mb-2 text-xs text-muted-foreground">
            Legacy production files are read-only here — deletion is blocked in the UI and by the
            server allowlist.
          </p>
        )}
        {loading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="Prefix is empty" hint={`No objects under ${prefix}`} />
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">{rows.length} objects</p>
            <Table>
              <thead>
                <tr>
                  <Th>Key</Th>
                  <Th>Size</Th>
                  <Th>Modified</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.path} className="hover:bg-muted/40">
                    <Td className="font-mono text-xs">{o.path.replace(prefix, "")}</Td>
                    <Td className="text-xs tabular-nums">{fmtBytes(o.size)}</Td>
                    <Td className="text-xs">
                      {o.lastModified ? new Date(o.lastModified).toLocaleString() : "—"}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button className="text-xs underline" onClick={() => showMeta(o.path)}>
                          info
                        </button>
                        <button className="text-xs underline" onClick={() => download(o.path)}>
                          download
                        </button>
                        {current.deletable ? (
                          <button
                            className="text-xs text-destructive underline"
                            onClick={() => {
                              setToDelete(o);
                              setDeleteError(null);
                            }}
                          >
                            delete
                          </button>
                        ) : (
                          <Chip
                            title="Legacy production files cannot be deleted."
                            className="border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            read-only
                          </Chip>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </div>

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete object?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p>
          Delete <code className="rounded bg-muted px-1 font-mono text-xs">{toDelete?.path}</code>?
          This routes through the server-side allowlist; it cannot delete legacy production files.
        </p>
        {deleteError && <p className="mt-2 text-xs text-destructive">{deleteError}</p>}
      </Dialog>

      <Dialog open={!!metaFor} onClose={() => setMetaFor(null)} title="Object metadata" wide>
        <p className="mb-2 font-mono text-xs text-muted-foreground">{metaFor}</p>
        {meta === null ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : Object.keys(meta).length === 0 ? (
          <p className="text-xs text-muted-foreground">No user metadata.</p>
        ) : (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
            {Object.entries(meta).map(([k, v]) => (
              <Fragment key={k}>
                <dt className="font-medium text-muted-foreground">{k}</dt>
                <dd className="break-words">{v}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </Dialog>
    </div>
  );
}
