"use client";

import { PLAY_LATER, RESULTS, STAKES } from "./copy";
import { Container } from "./ui";

export function Stakes() {
  return (
    <section className="bg-book-yellow py-5 text-book-green">
      <Container className="flex flex-col items-center text-center">
        <h2 className="text-[24px] font-extrabold leading-tight sm:text-[26px]">{STAKES.headline}</h2>
      </Container>
    </section>
  );
}

export function Results() {
  return (
    <section className="py-14 md:py-16">
      <Container className="flex flex-col gap-10">
        <div className="flex max-w-[860px] flex-col gap-5">
          <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[40px]">{RESULTS.lead}</h2>
          <ul className="flex flex-col gap-3 text-[21px] font-semibold leading-[1.3] sm:text-[23px]">
            {RESULTS.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="flex max-w-[860px] flex-col gap-2.5">
          <h3 className="text-[26px] font-extrabold leading-none text-book-green">{PLAY_LATER.headline}</h3>
          <p className="text-[18px] leading-[1.5]">{PLAY_LATER.body}</p>
        </div>
      </Container>
    </section>
  );
}
