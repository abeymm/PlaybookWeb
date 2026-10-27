// bookServer.ts — SERVER-ONLY glue for the Print book routes: the id-secret lookup (env, else
// the macOS Keychain item `playbook-id-secret`, read at spawn time) and the GolfAPI id lookup.
// The secret is returned to the caller for the child's ENV only; nothing here logs or returns it
// to a response.

import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { courseJsonPath, inputJsonPath, runDir } from "./config";
import path from "node:path";
import { golfapiIdFromCourse, resolveIdSecret } from "./book";

const KEYCHAIN_SERVICE = "playbook-id-secret";

function readKeychainSecret(): string | null {
  try {
    return execFileSync("security", ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"], {
      encoding: "utf8", timeout: 20_000, stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

/** The D9 id secret for a spawn: PLAYBOOK_ID_SECRET, else the Keychain item. Null when neither. */
export function loadIdSecret(): string | null {
  return resolveIdSecret(process.env, readKeychainSecret);
}

/** Whether a secret exists, without reading its value (attributes-only Keychain query: no prompt). */
let availableCache: { at: number; value: boolean } | null = null;
const AVAILABLE_TTL_MS = 60_000;

export function idSecretAvailable(): boolean {
  if (process.env.PLAYBOOK_ID_SECRET) return true;
  const now = Date.now();
  if (availableCache && now - availableCache.at < AVAILABLE_TTL_MS) return availableCache.value;   // status is polled every 2 s
  const r = spawnSync("security", ["find-generic-password", "-s", KEYCHAIN_SERVICE], { stdio: "ignore", timeout: 20_000 });
  availableCache = { at: now, value: r.status === 0 };
  return availableCache.value;
}

/** `apiCourseId` of the generated JSON, else the scorecard-merged input, else the seeded input_cache copy. */
export function findGolfapiId(key: string): string | null {
  const candidates = [courseJsonPath(key), inputJsonPath(key), path.join(runDir(key), "input_cache", `${key}.json`)];
  for (const f of candidates) {
    try {
      const id = golfapiIdFromCourse(JSON.parse(fs.readFileSync(f, "utf8")));
      if (id) return id;
    } catch {
      /* try the next source */
    }
  }
  return null;
}
