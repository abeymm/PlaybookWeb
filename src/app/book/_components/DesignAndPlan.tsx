"use client";

import { DESIGN, PLAN } from "./copy";
import { Container, Eyebrow } from "./ui";

export function Design() {
  return (
    <section className="py-16 md:py-20">
      <Container className="flex flex-col gap-7">
        <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[44px]">{DESIGN.headline}</h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DESIGN.stats.map((item) => (
            <li key={item.stat} className="flex flex-col gap-1.5 border-t-[3px] border-book-yellow bg-book-paper p-5">
              <span className="font-book-display text-[30px] font-extrabold leading-none">{item.stat}</span>
              <p className="text-[16px] leading-[1.45] text-book-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function Plan() {
  return (
    <section className="bg-book-green py-16 text-book-cream md:py-20">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Eyebrow className="text-book-yellow">{PLAN.eyebrow}</Eyebrow>
          <h2 className="text-[34px] font-extrabold leading-none sm:text-[44px]">{PLAN.headline}</h2>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {PLAN.steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2.5 rounded-lg border border-book-green-line p-6">
              <span aria-hidden="true" className="font-book-display text-[40px] font-extrabold leading-none text-book-yellow">
                {index + 1}
              </span>
              <h3 className="text-[26px] font-bold leading-[1.1]">{step.title}</h3>
              <p className="text-[17px] leading-[1.5] text-book-pale">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="font-book-display text-[24px] font-extrabold text-book-yellow">{PLAN.closing}</p>
      </Container>
    </section>
  );
}
