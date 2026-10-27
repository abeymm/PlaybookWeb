"use client";

import { RESULTS, STAKES } from "./copy";
import { Container, Eyebrow } from "./ui";

export function Stakes() {
  return (
    <section className="bg-book-yellow py-5 text-book-green">
      <Container className="flex flex-col items-center gap-1.5 text-center lg:flex-row lg:items-baseline lg:justify-center lg:gap-7">
        <h2 className="text-[24px] font-extrabold leading-tight sm:text-[26px]">{STAKES.headline}</h2>
        <p className="max-w-[640px] text-[16px] font-medium leading-[1.4] sm:text-[17px]">{STAKES.body}</p>
      </Container>
    </section>
  );
}

export function Results() {
  return (
    <section className="pb-6 pt-14">
      <Container className="flex flex-col gap-6">
        <Eyebrow className="text-book-orange">{RESULTS.eyebrow}</Eyebrow>
        <ol className="grid gap-6 md:grid-cols-3">
          {RESULTS.items.map((item, index) => (
            <li
              key={item.title}
              className="flex flex-col gap-2.5 rounded-lg border border-book-line bg-book-paper p-6"
            >
              <span aria-hidden="true" className="font-book-display text-[40px] font-extrabold leading-none text-book-green">
                {index + 1}
              </span>
              <h3 className="text-[25px] font-bold leading-[1.1] sm:text-[26px]">{item.title}</h3>
              <p className="text-[17px] leading-[1.5] text-book-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
