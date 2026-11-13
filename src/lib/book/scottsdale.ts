/**
 * Facts for the TPC Scottsdale event page (/scottsdale). Prices and the pickup day come from the
 * owner's decisions of 2026-11-11 and 2026-11-12 (Marketing/PlaybookSales/USAmTour-Scottsdale-Actions-2026-11.md
 * and the Dan/Joe email draft). Anything the owner has not confirmed is a visible placeholder in the copy.
 */

export const EVENT_FACTS = {
  preorderPrice: "$40",
  tablePrice: "$45",
  storePrice: "$79",
  pickupDay: "Saturday, Dec 5",
} as const;

export type AppPlaybook = { course: "Champions" | "Stadium"; href: string | null };

/**
 * The two app Playbooks for the event. TODO(owner): paste each course's share link as `href`.
 * They must be sign-in links (`https://playbook.golf/protected/<id>`), never `/public`: the shared
 * file carries course data (owner decision E1, 2026-11-11). `null` shows a marked placeholder.
 */
export const APP_PLAYBOOKS: readonly AppPlaybook[] = [
  { course: "Champions", href: null },
  { course: "Stadium", href: null },
];

const PROTECTED_PATH = /^\/protected\/[A-Za-z0-9_-]+$/;

/** True only for an https://playbook.golf/protected/<id> link (the sign-in form of a shared Playbook). */
export function isProtectedPlaybookLink(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  return url.protocol === "https:" && url.hostname === "playbook.golf" && PROTECTED_PATH.test(url.pathname);
}
