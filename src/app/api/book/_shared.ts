import type { Parsed } from "@/lib/book/forms";
import { deliver, type Submission } from "@/lib/book/delivery";

/** Largest JSON body, in bytes, either form may send. */
export const MAX_BODY_BYTES = 4096;

const MSG_BAD_JSON = "Send a JSON object.";
const MSG_TOO_LARGE = "Request too large.";
const MSG_UNCONFIGURED =
  "Sending is not set up yet. Email support@playbook.golf and we will send it by hand.";

type Deps = { deliver?: typeof deliver; now?: () => Date };

function fail(status: number, error: string, extra: object = {}): Response {
  return Response.json({ ok: false, error, ...extra }, { status });
}

function declaredTooLarge(req: Request): boolean {
  const declared = Number(req.headers.get("content-length"));
  return Number.isFinite(declared) && declared > MAX_BODY_BYTES;
}

type Body = { kind: "ok"; json: unknown } | { kind: "response"; response: Response };

async function readJson(req: Request): Promise<Body> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().includes("application/json")) {
    return { kind: "response", response: fail(400, MSG_BAD_JSON) };
  }
  if (declaredTooLarge(req)) return { kind: "response", response: fail(413, MSG_TOO_LARGE) };
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return { kind: "response", response: fail(413, MSG_TOO_LARGE) };
  }
  try {
    return { kind: "ok", json: JSON.parse(text) };
  } catch {
    return { kind: "response", response: fail(400, MSG_BAD_JSON) };
  }
}

/**
 * Shared POST flow for both forms: read and size-check the JSON, validate, drop honeypot hits
 * silently, deliver, and map the outcome to a response.
 */
export async function handleFormPost<T extends { spam: boolean }>(
  req: Request,
  parse: (body: unknown) => Parsed<T>,
  toSubmission: (value: T, receivedAt: string) => Submission,
  deps: Deps = {},
): Promise<Response> {
  const body = await readJson(req);
  if (body.kind === "response") return body.response;
  const parsed = parse(body.json);
  if (!parsed.ok) return fail(400, parsed.error, { fields: parsed.fields });
  if (parsed.value.spam) return Response.json({ ok: true });
  const receivedAt = (deps.now ?? (() => new Date()))().toISOString();
  const result = await (deps.deliver ?? deliver)(toSubmission(parsed.value, receivedAt));
  if (!result.ok) return fail(503, MSG_UNCONFIGURED);
  return Response.json({ ok: true });
}
