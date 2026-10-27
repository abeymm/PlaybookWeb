"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FINAL, FOOTER } from "./copy";
import { useBookStore } from "./store";
import { BuyButton, Container } from "./ui";

export function FinalCta() {
  return (
    <section className="bg-book-green py-16 text-book-cream md:py-20">
      <Container className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-[38px] font-extrabold leading-none sm:text-[46px] lg:text-[52px]">{FINAL.headline}</h2>
          <p className="text-[18px] text-book-pale">{FINAL.body}</p>
        </div>
        <BuyButton />
      </Container>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="py-7 text-[14px] text-book-muted">
      <Container className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p>{FOOTER.disclaimer}</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
          {FOOTER.links.map((link) =>
            link.href.startsWith("#") ? (
              <a key={link.href} href={link.href} className="py-2 underline-offset-4 hover:underline">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="py-2 underline-offset-4 hover:underline">
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </Container>
    </footer>
  );
}

/** Phones only: the buy bar slides up once the hero (and its own buy button) has scrolled away. */
export function StickyBuyBar() {
  const { course, price } = useBookStore();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting), { threshold: 0 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={!shown}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-book-green px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 text-book-cream shadow-[0_-8px_24px_rgba(0,0,0,0.25)] transition-transform duration-300 md:hidden",
        shown ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-book-display text-[12px] font-bold uppercase tracking-[0.08em] text-book-mint">
          {course.short}
        </span>
        <span className="text-[17px] font-semibold">{price}</span>
      </div>
      <BuyButton size="md" className="shrink-0" />
    </div>
  );
}
