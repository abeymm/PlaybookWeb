"use client";

import { PLAY_LATER } from "./copy";
import { Container } from "./ui";

export function PlayLater() {
  return (
    <section className="py-10 md:py-12">
      <Container className="flex flex-col gap-6">
        <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[40px]">{PLAY_LATER.headline}</h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {PLAY_LATER.items.map((item) => (
            <li key={item.title} className="flex flex-col gap-2 rounded-lg bg-book-pale p-6">
              <h3 className="font-book-display text-[15px] font-bold uppercase tracking-[0.14em] text-book-green">{item.title}</h3>
              <p className="text-[18px] leading-[1.45]">{item.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
