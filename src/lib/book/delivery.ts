/**
 * Delivery seam for the /book forms. The route handlers call `deliver` and know nothing about
 * where a submission ends up.
 */

export type Submission =
  | { kind: "sample"; email: string; updates: boolean; receivedAt: string }
  | {
      kind: "course-request";
      email: string;
      course: string;
      groupSize?: number;
      receivedAt: string;
    };

export type DeliveryResult = { ok: true; provider: string } | { ok: false; reason: "unconfigured" };

export type DeliveryEnv = { BOOK_FORMS_DELIVERY?: string; NODE_ENV?: string };

export type DeliveryLogger = { info: (msg: string) => void; warn: (msg: string) => void };

/**
 * Chooses the provider from the environment. "log" when BOOK_FORMS_DELIVERY is "log", or when it
 * is unset/blank outside production. Anything else, including unknown values, is unconfigured.
 */
export function resolveProvider(env: DeliveryEnv): "log" | "unconfigured" {
  const value = env.BOOK_FORMS_DELIVERY?.trim() ?? "";
  if (value === "") return env.NODE_ENV !== "production" ? "log" : "unconfigured";
  return value === "log" ? "log" : "unconfigured";
}

/** Hands a validated submission to the configured provider. */
export async function deliver(
  sub: Submission,
  env: DeliveryEnv = process.env,
  logger: DeliveryLogger = console,
): Promise<DeliveryResult> {
  // TODO(owner): choose the delivery provider.
  //
  // Two realistic options:
  //   1. An email service that (a) sends the sample PDF to the address on a "sample" submission
  //      (the file is at Marketing/Samples/2026-10-27/tpc-stadium-sample.pdf, outside this repo
  //      and deliberately NOT a public static file) and (b) forwards "course-request"
  //      submissions to the owner.
  //   2. Storage the owner reads, such as DynamoDB or S3 through Amplify.
  //
  // A new provider is one more case in this switch plus a documented value for
  // BOOK_FORMS_DELIVERY.
  //
  // "log" writes the submission, which contains an email address, to the server log. It is for
  // development. In production, set BOOK_FORMS_DELIVERY=log only on purpose.
  switch (resolveProvider(env)) {
    case "log":
      logger.info("[book-forms] " + JSON.stringify(sub));
      return { ok: true, provider: "log" };
    case "unconfigured":
      logger.warn("[book-forms] BOOK_FORMS_DELIVERY is not set; submission dropped");
      return { ok: false, reason: "unconfigured" };
  }
}
