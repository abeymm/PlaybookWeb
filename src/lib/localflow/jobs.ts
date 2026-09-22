// jobs.ts — a minimal in-memory registry for the /local flow's long-running local processes
// (make_coursedata.py generation, the iOS archive export). One job per (kind, key) at a time;
// stdout/stderr go to a log file the status endpoint tails. The process spawner is injected so
// the state machine is unit-tested without spawning anything.

export type JobKind = "generate" | "export";
export type JobStatus = "running" | "succeeded" | "failed";

export interface JobSpec {
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  /** Appended to with the process's combined stdout + stderr. */
  logFile: string;
}

export interface JobRecord {
  id: string;
  kind: JobKind;
  key: string;
  status: JobStatus;
  pid?: number;
  startedAt: string;
  endedAt?: string;
  exitCode?: number | null;
  logFile: string;
  /** Set when the process could not be started at all. */
  error?: string;
}

export interface SpawnHandle {
  pid?: number;
  onExit(cb: (code: number | null) => void): void;
}

export interface Spawner {
  spawn(spec: JobSpec): SpawnHandle;
}

export class JobRegistry {
  private jobs = new Map<string, JobRecord>();
  private seq = 0;

  constructor(private readonly spawner: Spawner) {}

  private static slot(kind: JobKind, key: string): string {
    return `${kind}:${key}`;
  }

  get(kind: JobKind, key: string): JobRecord | undefined {
    return this.jobs.get(JobRegistry.slot(kind, key));
  }

  /** Start a job; throws if one of the same kind is still running for this key. */
  start(kind: JobKind, key: string, spec: JobSpec): JobRecord {
    const slot = JobRegistry.slot(kind, key);
    const existing = this.jobs.get(slot);
    if (existing?.status === "running") {
      throw new Error(`${kind} already running for ${key} (pid ${existing.pid ?? "?"})`);
    }
    const job: JobRecord = {
      id: `${kind}-${key}-${++this.seq}`,
      kind,
      key,
      status: "running",
      startedAt: new Date().toISOString(),
      logFile: spec.logFile,
    };
    this.jobs.set(slot, job);
    try {
      const handle = this.spawner.spawn(spec);
      job.pid = handle.pid;
      handle.onExit((code) => {
        job.exitCode = code;
        job.status = code === 0 ? "succeeded" : "failed";
        job.endedAt = new Date().toISOString();
      });
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : String(err);
      job.endedAt = new Date().toISOString();
    }
    return job;
  }
}
