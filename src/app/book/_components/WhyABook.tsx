"use client";

import Image from "next/image";
import { BOOK_IMAGES } from "../_images";
import { WHY_A_BOOK } from "./copy";
import { Container } from "./ui";

export function WhyABook() {
  return (
    <section className="pb-16 pt-12">
      <Container className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
        <figure className="flex w-full max-w-[300px] shrink-0 flex-col gap-2">
          <Image
            {...BOOK_IMAGES.cover}
            alt={WHY_A_BOOK.coverAlt}
            sizes="300px"
            className="h-auto w-full rounded-md shadow-[0_16px_36px_rgba(20,28,23,0.25)]"
          />
          <figcaption className="text-center text-[13px] text-book-muted">{WHY_A_BOOK.photoPlaceholder}</figcaption>
        </figure>
        <div className="flex min-w-0 flex-col gap-4">
          <p className="font-book-display text-[28px] font-bold leading-[1.15] text-book-green sm:text-[30px]">
            {WHY_A_BOOK.empathy}
          </p>
          <h2 className="mt-2 text-[22px] font-extrabold uppercase tracking-[0.1em] text-book-muted">
            {WHY_A_BOOK.heading}
          </h2>
          <ul className="flex flex-col gap-2.5 text-[18px] leading-[1.45]">
            {WHY_A_BOOK.points.map((point) => (
              <li key={point} className="flex gap-3">
                <span aria-hidden="true" className="mt-[9px] h-2.5 w-2.5 shrink-0 rounded-full bg-book-yellow" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="text-[16px] leading-[1.5] text-book-muted">{WHY_A_BOOK.specs}</p>
        </div>
      </Container>
    </section>
  );
}
