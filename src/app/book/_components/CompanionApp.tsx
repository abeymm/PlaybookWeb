"use client";

import Image from "next/image";
import Link from "next/link";
import { BOOK_IMAGES } from "../_images";
import { APP } from "./copy";
import { Container, Eyebrow } from "./ui";

/**
 * The one section about the app. The book stays the product; the yellow filled button stays the buy button.
 * "See the app" opens in a new tab so the buyer stays on this page.
 */
export function CompanionApp() {
  return (
    <section className="bg-book-green-deep py-16 text-book-cream md:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-5">
          <Eyebrow className="text-book-yellow">{APP.eyebrow}</Eyebrow>
          <h2 className="text-[36px] font-extrabold leading-[1.02] sm:text-[44px] lg:text-[50px]">{APP.headline}</h2>
          <p className="max-w-[620px] text-[18px] leading-[1.5] text-book-pale">{APP.body}</p>
          <ul className="flex flex-col gap-3 text-[18px] leading-[1.45]">
            {APP.items.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span aria-hidden="true" className="mt-[9px] h-2.5 w-2.5 shrink-0 rounded-full bg-book-yellow" />
                <span>
                  <strong className="font-semibold text-book-cream">{item.title}: </strong>
                  <span className="text-book-pale">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link
            href={APP.href}
            target="_blank"
            rel="noopener"
            className="inline-flex h-12 w-fit items-center justify-center rounded-md border-2 border-book-yellow px-5 font-book-display text-[20px] font-extrabold tracking-[0.04em] text-book-yellow transition hover:bg-book-yellow hover:text-book-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-book-yellow/40"
          >
            {APP.link}
          </Link>
        </div>
        <figure className="mx-auto w-full max-w-[300px] lg:max-w-none">
          <Image
            {...BOOK_IMAGES.appHoleMap}
            alt={APP.imageAlt}
            sizes="(min-width: 1024px) 340px, 300px"
            className="h-auto w-full rounded-[28px] border-4 border-book-green-border shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
          />
        </figure>
      </Container>
    </section>
  );
}
