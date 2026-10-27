import { describe, it, expect } from "vitest";
import {
  resolveShop,
  courseById,
  purchasableCourses,
  buyUrlFor,
  priceFor,
  LAUNCH_COURSES,
  BUY_URL_PLACEHOLDER,
  BOOK_PRICING,
  type LaunchCourse,
  type ShopSettings,
} from "@/lib/book/catalog";

describe("resolveShop", () => {
  it("uses the buy placeholder and the default price when both are unset", () => {
    expect(resolveShop(undefined, undefined)).toEqual({
      buyUrl: BUY_URL_PLACEHOLDER,
      price: BOOK_PRICING.single,
      isBuyUrlPlaceholder: true,
      isPricePlaceholder: true,
    });
  });
  it("uses the values when set", () => {
    expect(resolveShop("https://shop.example/x", "$39")).toEqual({
      buyUrl: "https://shop.example/x",
      price: "$39",
      isBuyUrlPlaceholder: false,
      isPricePlaceholder: false,
    });
  });
  it("treats blank and whitespace as unset", () => {
    const s = resolveShop("", "   ");
    expect(s.isBuyUrlPlaceholder).toBe(true);
    expect(s.isPricePlaceholder).toBe(true);
    expect(s.buyUrl).toBe(BUY_URL_PLACEHOLDER);
  });
  it("trims set values", () => {
    expect(resolveShop("  https://a.example/ ", " $5 ").price).toBe("$5");
  });
});

describe("BOOK_PRICING", () => {
  it("falls back to the single-book price", () => {
    expect(resolveShop(undefined, undefined).price).toBe(BOOK_PRICING.single);
    expect(resolveShop("", "  ").price).toBe(BOOK_PRICING.single);
  });
  it("has packs enabled", () => {
    expect(BOOK_PRICING.packs.enabled).toBe(true);
  });
  it("has three tiers; only the first has no price", () => {
    const tiers = BOOK_PRICING.packs.tiers;
    expect(tiers.map((t) => t.label)).toEqual(["1 book", "2 books", "3 or more"]);
    expect("price" in tiers[0]).toBe(false);
    expect(tiers[1].price).toBeTruthy();
    expect(tiers[2].price).toBeTruthy();
  });
  it("sets free shipping from $100", () => {
    expect(BOOK_PRICING.packs.freeShippingFrom).toBe("$100");
  });
});

describe("courseById", () => {
  it("falls back to the first course for unknown or null ids", () => {
    expect(courseById("nope")).toBe(LAUNCH_COURSES[0]);
    expect(courseById(null)).toBe(LAUNCH_COURSES[0]);
    expect(courseById(undefined)).toBe(LAUNCH_COURSES[0]);
  });
  it("returns the matching course", () => {
    expect(courseById("tpc-scottsdale-champions").id).toBe("tpc-scottsdale-champions");
  });
});

describe("purchasableCourses", () => {
  it("returns exactly the two TPC Scottsdale books", () => {
    expect(purchasableCourses().map((c) => c.id)).toEqual([
      "tpc-scottsdale-stadium",
      "tpc-scottsdale-champions",
    ]);
  });
  it("has no placeholder entry in the launch list", () => {
    expect(LAUNCH_COURSES.some((c) => c.placeholder)).toBe(false);
  });
});

describe("buyUrlFor / priceFor", () => {
  const shop: ShopSettings = resolveShop("https://shop.example/default", "$40");
  const plain: LaunchCourse = { id: "a", name: "A", short: "A", tee: "T" };
  const custom: LaunchCourse = {
    ...plain,
    buyUrl: "https://shop.example/a",
    price: "$45",
  };
  it("uses the shop value when the course has no override", () => {
    expect(buyUrlFor(plain, shop)).toBe("https://shop.example/default");
    expect(priceFor(plain, shop)).toBe("$40");
  });
  it("per-course override wins", () => {
    expect(buyUrlFor(custom, shop)).toBe("https://shop.example/a");
    expect(priceFor(custom, shop)).toBe("$45");
  });
  it("blank overrides fall back to the shop", () => {
    const blank = { ...plain, buyUrl: "  ", price: " " };
    expect(buyUrlFor(blank, shop)).toBe("https://shop.example/default");
    expect(priceFor(blank, shop)).toBe("$40");
  });
});
