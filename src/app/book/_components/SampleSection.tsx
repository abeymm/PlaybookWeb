"use client";

import Image from "next/image";
import { BOOK_IMAGES } from "../_images";
import { HERO, SAMPLE } from "./copy";
import { Container } from "./ui";

const PAGE_CLASS = "h-auto w-[31%] max-w-[190px] rounded shadow-[0_12px_28px_rgba(20,28,23,0.22)]";
const PAGE_SIZES = "(min-width: 1024px) 190px, 30vw";

export function SampleSection() {
  return (
    <section id="sample" className="scroll-mt-16 py-16 md:py-20">
      <Container className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[44px]">{SAMPLE.headline}</h2>
          <p className="text-[18px] leading-[1.5] text-book-muted">{SAMPLE.body}</p>
          <a
            href={SAMPLE.pdfHref}
            target="_blank"
            rel="noopener"
            className="inline-flex h-12 w-fit items-center justify-center rounded-md bg-book-green px-5 font-book-display text-[20px] font-extrabold tracking-[0.04em] text-book-cream transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-book-green/30"
          >
            {SAMPLE.button}
          </a>
          <p className="text-[14px] text-book-muted">{SAMPLE.note}</p>
        </div>
        <div className="flex w-full flex-1 justify-center gap-2.5">
          <Image {...BOOK_IMAGES.howtoPage} alt={SAMPLE.howtoAlt} sizes={PAGE_SIZES} className={PAGE_CLASS} />
          <Image {...BOOK_IMAGES.heroGreenPage} alt={HERO.greenPageAlt} sizes={PAGE_SIZES} className={PAGE_CLASS} />
          <Image {...BOOK_IMAGES.heroMapPage} alt={HERO.mapPageAlt} sizes={PAGE_SIZES} className={PAGE_CLASS} />
        </div>
      </Container>
    </section>
  );
}
