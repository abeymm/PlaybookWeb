/**
 * Delivery seam for the /book forms (course request, TPC Scottsdale pre-order). The route handler
 * calls `deliver` and knows nothing about where a submission ends up.
 */
import { sendSubmitForm, toFormRequest, type SubmitFormRequest } from "./submitForm";

export type Submission =
  | {
      kind: "course-request";
      email: string;
      course: string;
      groupSize?: number;
      receivedAt: string;
    }
  | {
      kind: "scottsdale-preorder";
      name: string;
      email: string;
      receivedAt: string;
    };

export type DeliveryResult =
  | { ok: true; provider: string }
  | { ok: false; reason: "unconfigured" | "failed" };

/** Sends one form request to the mailer; throws on failure. */
export type FormSender = (req: SubmitFormRequest) => Promise<void>;

export type DeliveryEnv = { BOOK_FORMS_DELIVERY?: string; NODE_ENV?: string; BOOK_CONFIRM_SECRET?: string };

export type DeliveryLogger = { info: (msg: string) => void; warn: (msg: string) => void };

/**
 * Chooses the provider from the environment. Unset or blank: "appsync" in production (email to
 * support@playbook.golf through the Backend form mailer) and "log" everywhere else, so a local run
 * never sends real email even though the local config points at the production backend. An explicit
 * "log" or "appsync" is an override. Anything else, including unknown values, is unconfigured.
 */
export function resolveProvider(env: DeliveryEnv): "log" | "appsync" | "unconfigured" {
  const value = env.BOOK_FORMS_DELIVERY?.trim() ?? "";
  if (value === "") return env.NODE_ENV === "production" ? "appsync" : "log";
  if (value === "log") return "log";
  return value === "appsync" ? "appsync" : "unconfigured";
}

/** Hands a validated submission to the configured provider. */
export async function deliver(
  sub: Submission,
  env: DeliveryEnv = process.env,
  logger: DeliveryLogger = console,
  send: FormSender = sendSubmitForm,
): Promise<DeliveryResult> {
  // Providers: "log" (default outside production) and "appsync" (default in production: one email
  // per submission to support@playbook.golf, no database). BOOK_FORMS_DELIVERY only overrides the
  // default. A new provider is one more case in this switch plus a documented value.
  //
  // "log" writes the submission, which contains an email address, to the server log. It is for
  // development. In production, set BOOK_FORMS_DELIVERY=log only on purpose.
  switch (resolveProvider(env)) {
    case "log":
      logger.info("[book-forms] " + JSON.stringify(sub));
      return { ok: true, provider: "log" };
    case "appsync":
      try {
        await send(toFormRequest(sub, env.BOOK_CONFIRM_SECRET));
        return { ok: true, provider: "appsync" };
      } catch (error) {
        // The message is the mailer's own; it never carries the submission, so the log stays free of the email.
        logger.warn(`[book-forms] appsync delivery failed: ${error instanceof Error ? error.message : "unknown error"}`);
        return { ok: false, reason: "failed" };
      }
    case "unconfigured":
      logger.warn("[book-forms] BOOK_FORMS_DELIVERY is not set; submission dropped");
      return { ok: false, reason: "unconfigured" };
  }
}
