/**
 * Course book catalogue and shop settings for the /book sales page.
 *
 * Everything the owner edits lives in this file or in two environment variables:
 *
 *   NEXT_PUBLIC_BOOK_BUY_URL   the Shopify product or checkout URL the buy buttons open
 *                              (a course may override it with `buyUrl`). Unset → an obvious
 *                              placeholder URL, so the gap stays visible on the page.
 *   NEXT_PUBLIC_BOOK_PRICE     overrides BOOK_PRICING.single, e.g. "$49" (a course may override
 *                              it with `price`).
 *
 * NEXT_PUBLIC_* values are baked in at build time: set them in Amplify Hosting's environment
 * (or in .env.local for `next dev`) and rebuild.
 *
 * The launch collection is the top US golf destinations only. Never list every course here,
 * and the page never states a course count.
 */

export type LaunchCourse = {
  /** Stable slug used as the selector value. */
  id: string;
  /** The course name as printed on the cover. */
  name: string;
  /** Short form for the sticky buy bar. */
  short: string;
  /** The tee the book is planned from, as printed on the cover. */
  tee: string;
  /** The level of play the landing ovals are sized for. */
  level?: string;
  /** Per-course Shopify URL; falls back to NEXT_PUBLIC_BOOK_BUY_URL. */
  buyUrl?: string;
  /** Per-course price; falls back to the single-book price. */
  price?: string;
  /** Not yet purchasable: kept out of the selector and the buy buttons. */
  placeholder?: boolean;
};

// Owner: add one entry per book as it ships. The selector lists only purchasable books.
export const LAUNCH_COURSES: readonly LaunchCourse[] = [
  {
    id: "tpc-scottsdale-stadium",
    name: "TPC Scottsdale, PGA Stadium",
    short: "TPC Scottsdale, Stadium",
    tee: "Blue/White",
    level: "low handicap",
  },
  {
    id: "tpc-scottsdale-champions",
    name: "TPC Scottsdale, Champions",
    short: "TPC Scottsdale, Champions",
    tee: "Blue/White",
    level: "low handicap",
  },
];

export const DEFAULT_COURSE_ID = LAUNCH_COURSES[0].id;

export type PackTier = {
  label: string;
  /** Omitted = the single-book price (so an env override keeps the first row in step). */
  price?: string;
  /** Shown after the price, e.g. which books the pack is. */
  note?: string;
};

/**
 * Prices. All placeholders until the owner marks them final
 * (iOS/Docs/Plans/Playbook-Master-Plan.md §1.4, owner 2026-10-27: a destination book is $49;
 * packs $89 for two and $39 each from three, shown once `packs.enabled` is on; shipping is
 * free at $100 and over). Discount codes are entered at Shopify
 * checkout, never on the page, and there is no public group price: groups go through the
 * request form.
 */
export const BOOK_PRICING = {
  /** Shown wherever a price appears. Env override: NEXT_PUBLIC_BOOK_PRICE. */
  single: "$49",
  packs: {
    /** When true, the tiers and the free-shipping line are shown. */
    enabled: true,
    tiers: [
      { label: "1 book" },
      { label: "2 books", price: "$89", note: "Both Scottsdale books" },
      { label: "3 or more", price: "$39 each" },
    ] as readonly PackTier[],
    freeShippingFrom: "$100",
  },
} as const;

/** `.example` is a reserved domain, so the placeholder can never resolve to a real shop. */
export const BUY_URL_PLACEHOLDER = "https://replace-with-your-shopify-url.example/";

export type ShopSettings = {
  buyUrl: string;
  price: string;
  /** True until NEXT_PUBLIC_BOOK_BUY_URL is set. */
  isBuyUrlPlaceholder: boolean;
  /** True while the price is the config default rather than an env override. */
  isPricePlaceholder: boolean;
};

/** Pure: resolves the two shop settings from their raw env values (blank counts as unset). */
export function resolveShop(buyUrl: string | undefined, price: string | undefined): ShopSettings {
  const url = buyUrl?.trim() ?? "";
  const shown = price?.trim() ?? "";
  return {
    buyUrl: url || BUY_URL_PLACEHOLDER,
    price: shown || BOOK_PRICING.single,
    isBuyUrlPlaceholder: url === "",
    isPricePlaceholder: shown === "",
  };
}

// Referenced literally so Next.js inlines them into the client bundle.
export const BOOK_SHOP: ShopSettings = resolveShop(
  process.env.NEXT_PUBLIC_BOOK_BUY_URL,
  process.env.NEXT_PUBLIC_BOOK_PRICE,
);

/** Facts printed in the book itself; the page quotes them. */
export const BOOK_FACTS = {
  editionYear: "2027",
  pages: 40,
  size: "4¼ × 7 in",
  /** Sea-level-equivalent yards the planning tee is chosen for. */
  planningYards: "6,250",
} as const;

export function courseById(id: string | null | undefined): LaunchCourse {
  return LAUNCH_COURSES.find((c) => c.id === id) ?? LAUNCH_COURSES[0];
}

export function purchasableCourses(): LaunchCourse[] {
  return LAUNCH_COURSES.filter((c) => !c.placeholder);
}

export function buyUrlFor(course: LaunchCourse, shop: ShopSettings = BOOK_SHOP): string {
  return course.buyUrl?.trim() || shop.buyUrl;
}

export function priceFor(course: LaunchCourse, shop: ShopSettings = BOOK_SHOP): string {
  return course.price?.trim() || shop.price;
}
