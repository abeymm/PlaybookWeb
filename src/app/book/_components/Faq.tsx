"use client";

import { FAQ } from "./copy";
import { Container } from "./ui";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-book-line bg-book-paper py-14 md:py-16">
      <Container className="flex max-w-[860px] flex-col gap-1">
        <h2 className="mb-4 text-[40px] font-extrabold leading-none text-book-green">{FAQ.headline}</h2>
        {FAQ.items.map((item, index) => (
          <div
            key={item.id}
            id={item.id}
            className={
              "flex scroll-mt-16 flex-col gap-1.5 border-t border-book-line py-4" +
              (index === FAQ.items.length - 1 ? " border-b" : "")
            }
          >
            <h3 className="text-[24px] font-bold leading-tight">{item.question}</h3>
            <p className="text-[17px] leading-[1.5] text-book-muted">{item.answer}</p>
            {item.link ? (
              <a
                href={item.link.href}
                className="inline-block w-fit py-1.5 text-[17px] font-semibold text-book-green underline underline-offset-4"
              >
                {item.link.label}
              </a>
            ) : null}
          </div>
        ))}
      </Container>
    </section>
  );
}
