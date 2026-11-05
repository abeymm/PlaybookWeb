import { describe, it, expect } from "vitest";
import { JobRegistry, type Spawner, type SpawnHandle, type JobSpec } from "../jobs";

/** A spawner whose processes only exit when the test says so. */
function fakeSpawner() {
  const handles: Array<{ spec: JobSpec; exit: (code: number | null) => void }> = [];
  const spawner: Spawner = {
    spawn(spec) {
      let onExit: ((code: number | null) => void) | null = null;
      const handle: SpawnHandle = {
        pid: 1000 + handles.length,
        onExit(cb) { onExit = cb; },
      };
      handles.push({ spec, exit: (code) => onExit?.(code) });
      return handle;
    },
  };
  return { spawner, handles };
}

const spec = (n = 1): JobSpec => ({
  command: "python", args: ["make.py", String(n)], cwd: "/tmp", logFile: `/tmp/job-${n}.log`,
});

describe("JobRegistry", () => {
  it("starts a job as running and records the spawn", () => {
    const { spawner, handles } = fakeSpawner();
    const reg = new JobRegistry(spawner);
    const job = reg.start("generate", "way-1", spec());
    expect(job.status).toBe("running");
    expect(job.kind).toBe("generate");
    expect(job.key).toBe("way-1");
    expect(job.pid).toBe(1000);
    expect(handles[0].spec.args).toEqual(["make.py", "1"]);
    expect(reg.get("generate", "way-1")).toEqual(job);
  });

  it("marks exit code 0 as succeeded and non-zero as failed, with the code kept", () => {
    const { spawner, handles } = fakeSpawner();
    const reg = new JobRegistry(spawner);
    reg.start("generate", "way-1", spec(1));
    reg.start("generate", "way-2", spec(2));
    handles[0].exit(0);
    handles[1].exit(2);
    expect(reg.get("generate", "way-1")?.status).toBe("succeeded");
    expect(reg.get("generate", "way-1")?.exitCode).toBe(0);
    expect(reg.get("generate", "way-2")?.status).toBe("failed");
    expect(reg.get("generate", "way-2")?.exitCode).toBe(2);
    expect(reg.get("generate", "way-2")?.endedAt).toBeTypeOf("string");
  });

  it("treats a null exit code (killed by signal) as failed", () => {
    const { spawner, handles } = fakeSpawner();
    const reg = new JobRegistry(spawner);
    reg.start("export", "way-1", spec());
    handles[0].exit(null);
    expect(reg.get("export", "way-1")?.status).toBe("failed");
  });

  it("refuses a second concurrent job for the same kind and key", () => {
    const { spawner, handles } = fakeSpawner();
    const reg = new JobRegistry(spawner);
    reg.start("generate", "way-1", spec());
    expect(() => reg.start("generate", "way-1", spec())).toThrow(/already running/);
    // A different kind for the same key, or the same kind for another key, is fine.
    expect(reg.start("export", "way-1", spec()).status).toBe("running");
    expect(reg.start("generate", "way-2", spec()).status).toBe("running");
    // Once finished, the same kind+key may start again and replaces the old record.
    handles[0].exit(0);
    const again = reg.start("generate", "way-1", spec());
    expect(again.status).toBe("running");
    expect(reg.get("generate", "way-1")).toEqual(again);
  });

  it("reports a spawn failure as a failed job instead of throwing", () => {
    const spawner: Spawner = { spawn() { throw new Error("ENOENT: python not found"); } };
    const reg = new JobRegistry(spawner);
    const job = reg.start("generate", "way-1", spec());
    expect(job.status).toBe("failed");
    expect(job.error).toMatch(/ENOENT/);
  });
});
