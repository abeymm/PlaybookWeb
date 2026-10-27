"use client";

import Image from "next/image";
import { BOOK_PRICING } from "@/lib/book/catalog";
import { BOOK_IMAGES } from "../_images";
import { HERO } from "./copy";
import { useBookStore } from "./store";
import { BuyButton, Container, Eyebrow } from "./ui";

/** Quantity tiers, shown only once BOOK_PRICING.packs.enabled is on (prices decided). */
function PackTiers({ singlePrice }: { singlePrice: string }) {
  const { tiers, freeShippingFrom } = BOOK_PRICING.packs;
  return (
    <div className="flex max-w-[420px] flex-col gap-1.5 text-[16px]">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        {tiers.map((tier) => (
          <div key={tier.label} className="contents">
            <dt className="text-book-mint">{tier.label}</dt>
            <dd className="font-semibold">
              {tier.price ?? singlePrice}
              {tier.note ? <span className="font-normal text-book-mint"> · {tier.note}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[15px] text-book-mint">{HERO.freeShipping(freeShippingFrom)}</p>
    </div>
  );
}

export function Hero() {
  const { courses, course, selectCourse, price, shop } = useBookStore();
  const chips = [
    `Made for the ${course.tee} tee`,
    course.level ? `Landing ovals for a ${course.level}` : null,
    HERO.chipSpread,
  ].filter((chip): chip is string => chip !== null);

  return (
    <section id="top" className="bg-book-green pb-14 pt-10 text-book-cream md:pb-16 md:pt-14">
      <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-14">
        <div className="flex flex-col gap-5">
          <Eyebrow className="text-book-yellow">{HERO.eyebrow}</Eyebrow>
          <h1 className="text-[44px] font-extrabold leading-[0.98] tracking-[-0.01em] sm:text-[56px] lg:text-[68px]">
            {HERO.headline}
          </h1>
          <p className="max-w-[560px] text-[19px] leading-[1.45] text-book-pale sm:text-[20px]">
            {HERO.subhead}
          </p>

          <div id="courses" className="flex max-w-[420px] scroll-mt-20 flex-col gap-2">
            <label
              htmlFor="course"
              className="font-book-display text-[14px] font-bold uppercase tracking-[0.12em] text-book-mint"
            >
              {HERO.selectLabel}
            </label>
            <select
              id="course"
              value={course.id}
              onChange={(event) => selectCourse(event.target.value)}
              className="h-12 w-full rounded-md border border-book-green-border bg-book-green-deep px-3.5 text-[17px] text-book-cream focus:border-book-yellow focus:outline-none focus:ring-4 focus:ring-book-yellow/30"
            >
              {courses.map((option) => (
                <option key={option.id} value={option.id}>
                  {`${option.name} (${option.tee} tee)`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3.5">
            <BuyButton />
            <span className="text-[18px] font-semibold">
              {price} <span className="font-normal text-book-mint">· {HERO.priceTail}</span>
            </span>
          </div>
          {shop.isBuyUrlPlaceholder ? (
            <p className="text-[13px] text-book-mint">[Shopify link: set NEXT_PUBLIC_BOOK_BUY_URL]</p>
          ) : null}
          {BOOK_PRICING.packs.enabled ? <PackTiers singlePrice={price} /> : null}

          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <a
              href="#sample"
              className="py-1.5 text-[17px] font-semibold text-book-yellow underline underline-offset-4"
            >
              {HERO.sampleLink}
            </a>
            <a
              href="#request"
              className="py-1.5 text-[17px] font-semibold text-book-yellow underline underline-offset-4"
            >
              {HERO.groupsLink}
            </a>
          </div>

          <ul aria-label="What this book is made for" className="mt-1 flex flex-wrap gap-2.5">
            {chips.map((chip) => (
              <li
                key={chip}
                className="rounded border border-book-green-border px-2.5 py-1.5 font-book-display text-[14px] font-bold uppercase tracking-[0.08em] text-book-pale"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>

        <figure className="flex flex-col gap-3.5">
          <div className="flex items-start justify-center gap-2.5">
            <Image
              {...BOOK_IMAGES.heroGreenPage}
              alt={HERO.greenPageAlt}
              sizes="(min-width: 1024px) 300px, 45vw"
              priority
              className="h-auto w-[48%] max-w-[300px] rounded shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
            />
            <Image
              {...BOOK_IMAGES.heroMapPage}
              alt={HERO.mapPageAlt}
              sizes="(min-width: 1024px) 300px, 45vw"
              priority
              className="h-auto w-[48%] max-w-[300px] rounded shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
            />
          </div>
          <figcaption className="text-center text-[14px] text-book-mint">{HERO.figcaption}</figcaption>
        </figure>
      </Container>
    </section>
  );
}
