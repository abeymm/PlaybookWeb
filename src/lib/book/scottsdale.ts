/**
 * Facts for the TPC Scottsdale event page (/scottsdale). Prices and the pickup day come from the
 * owner's decisions of 2026-11-11 and 2026-11-12 (Marketing/PlaybookSales/USAmTour-Scottsdale-Actions-2026-11.md
 * and the Dan/Joe email draft). Anything the owner has not confirmed is a visible placeholder in the copy.
 */

export const EVENT_FACTS = {
  preorderPrice: "$40",
  tablePrice: "$50",
  storePrice: "$79",
  pickupDay: "Saturday, Dec 5",
} as const;

export type AppPlaybook = { course: "Champions" | "Stadium"; href: string; qr: string };

/**
 * The two app Playbooks for the event: the exact links and QR codes printed on the back cover of the
 * 84-page book (page 84), decoded from the printed PDF on 2026-11-20. They are sign-in links
 * (`https://playbook.golf/protected/<id>`), never `/public`: the shared file carries course data
 * (owner decision E1, 2026-11-11). `qr` is the code cropped from that page, kept as PNG so modules stay sharp.
 */
export const APP_PLAYBOOKS: readonly AppPlaybook[] = [
  {
    course: "Champions",
    href: "https://playbook.golf/protected/2C24F87D-1A90-416B-9918-69450C670E25?src=book",
    qr: "/scottsdale/qr-champions.png",
  },
  {
    course: "Stadium",
    href: "https://playbook.golf/protected/41699184-D8F6-4460-BDD1-05B57ECC9F68?src=book",
    qr: "/scottsdale/qr-stadium.png",
  },
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

/** True for an owner placeholder: the whole string is wrapped in [square brackets]. Placeholders stay in copy for developers and are never shown to buyers. */
export function isPlaceholder(text: string): boolean {
  const t = text.trim();
  return t.length >= 2 && t.startsWith("[") && t.endsWith("]");
}
