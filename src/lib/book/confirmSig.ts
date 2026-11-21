/**
 * Signs a Scottsdale pre-order so the Backend mailer can trust it before it emails the golfer.
 * SERVER ONLY: this module receives BOOK_CONFIRM_SECRET (a server environment variable, never
 * NEXT_PUBLIC) and must never be imported by a client component (a test checks this).
 *
 * confirmSig = lowercase hex HMAC-SHA256, key = UTF-8 secret trimmed of leading and trailing whitespace (the Backend trims the same way), message =
 * `scottsdale-preorder\n<email>\n<receivedAt>`. The Backend recomputes it byte for byte.
 */
import { createHmac } from "node:crypto";

export function confirmSig(secret: string, email: string, receivedAt: string): string {
  return createHmac("sha256", Buffer.from(secret.trim(), "utf8"))
    .update(`scottsdale-preorder\n${email}\n${receivedAt}`, "utf8")
    .digest("hex");
}
