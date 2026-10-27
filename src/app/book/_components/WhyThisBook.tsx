"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BOOK_IMAGES } from "../_images";
import { WHY_THIS_BOOK } from "./copy";
import { Container, Eyebrow } from "./ui";

const IMG_FRAME = "rounded-md border border-book-line";

function RowText({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Eyebrow className="text-book-orange">{eyebrow}</Eyebrow>
      <h3 className="text-[32px] font-extrabold leading-[1.05] sm:text-[36px]">{title}</h3>
      {children}
    </div>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <p className="text-[18px] leading-[1.5] text-book-muted">{children}</p>;
}

function SubTitle({ children }: { children: ReactNode }) {
  return <h4 className="mt-2 text-[22px] font-bold leading-tight">{children}</h4>;
}

function PlanRow() {
  const copy = WHY_THIS_BOOK.plan;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-14">
      <Image
        {...BOOK_IMAGES.planShotChain}
        alt={copy.mapAlt}
        sizes="(min-width: 1024px) 300px, 100vw"
        className={cn(IMG_FRAME, "mx-auto h-auto w-full max-w-[300px] lg:mx-0")}
      />
      <RowText eyebrow={copy.eyebrow} title={copy.title}>
        <Body>{copy.body}</Body>
        <SubTitle>{copy.ovalTitle}</SubTitle>
        <Body>{copy.ovalBody}</Body>
        <figure className="mt-2 flex max-w-[460px] flex-col gap-2">
          <Image
            {...BOOK_IMAGES.coneStartLines}
            alt={copy.coneAlt}
            sizes="(min-width: 640px) 460px, 100vw"
            className={cn(IMG_FRAME, "h-auto w-full")}
          />
          <figcaption className="text-[14px] text-book-muted">{copy.coneCaption}</figcaption>
        </figure>
      </RowText>
    </div>
  );
}

function MissRow() {
  const copy = WHY_THIS_BOOK.miss;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-14">
      <RowText eyebrow={copy.eyebrow} title={copy.title}>
        <Body>{copy.body}</Body>
      </RowText>
      <div className="flex flex-col gap-3">
        <Image
          {...BOOK_IMAGES.greenMap}
          alt={copy.greenAlt}
          sizes="(min-width: 1024px) 520px, 100vw"
          className={cn(IMG_FRAME, "h-auto w-full")}
        />
        <Image
          {...BOOK_IMAGES.missTable}
          alt={copy.tableAlt}
          sizes="(min-width: 1024px) 520px, 100vw"
          className={cn(IMG_FRAME, "h-auto w-full")}
        />
      </div>
    </div>
  );
}

function OrangeRow() {
  const copy = WHY_THIS_BOOK.orange;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[520px_minmax(0,1fr)] lg:gap-14">
      <Image
        {...BOOK_IMAGES.chips}
        alt={copy.chipsAlt}
        sizes="(min-width: 1024px) 520px, 100vw"
        className={cn(IMG_FRAME, "h-auto w-full max-w-[520px]")}
      />
      <RowText eyebrow={copy.eyebrow} title={copy.title}>
        <Body>{copy.body}</Body>
        <SubTitle>{copy.carryTitle}</SubTitle>
        <Body>{copy.carryBody}</Body>
      </RowText>
    </div>
  );
}

/** The six remaining features, image on top. Tall crops stand in the box; wide ones fill it. */
function CardImage({ cardKey, alt }: { cardKey: string; alt: string }) {
  const box = "flex h-[220px] items-center justify-center gap-3 overflow-hidden rounded bg-book-paper";
  const tall = "h-full w-auto";
  switch (cardKey) {
    case "ruler":
      return (
        <div className={box}>
          <Image {...BOOK_IMAGES.ruler} alt={alt} sizes="80px" className={tall} />
        </div>
      );
    case "greens":
      return (
        <div className={cn(box, "px-3")}>
          <Image {...BOOK_IMAGES.profiles} alt={alt} sizes="(min-width: 640px) 360px, 100vw" className="h-auto w-full" />
        </div>
      );
    case "tee":
      return (
        <div className={box}>
          <Image {...BOOK_IMAGES.tees} alt={alt} sizes="(min-width: 640px) 360px, 100vw" className="h-full w-full object-cover object-center" />
        </div>
      );
    case "terrain":
      return (
        <div className={box}>
          <Image {...BOOK_IMAGES.elevationStrip} alt="" sizes="40px" className={tall} />
          <Image {...BOOK_IMAGES.terrainRelief} alt={alt} sizes="120px" className={tall} />
        </div>
      );
    case "wind":
      return (
        <div className={box}>
          <Image {...BOOK_IMAGES.windPage} alt={alt} sizes="140px" className={tall} />
        </div>
      );
  }
}

export function WhyThisBook() {
  return (
    <section id="why" className="border-y border-book-line bg-book-paper py-16 md:py-20">
      <Container className="flex flex-col gap-14">
        <div className="flex max-w-[820px] flex-col gap-3">
          <h2 className="text-[38px] font-extrabold leading-none text-book-green sm:text-[46px] lg:text-[52px]">
            {WHY_THIS_BOOK.headline}
          </h2>
          <p className="font-book-display text-[26px] font-bold leading-[1.15] sm:text-[30px]">{WHY_THIS_BOOK.tieLine}</p>
        </div>
        <PlanRow />
        <MissRow />
        <OrangeRow />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_THIS_BOOK.cards.map((card) => (
            <li key={card.key} className="flex flex-col gap-3 rounded-lg border border-book-line bg-book-cream p-5">
              <CardImage cardKey={card.key} alt={card.alt} />
              <h3 className="text-[26px] font-extrabold leading-[1.05]">{card.title}</h3>
              <p className="text-[16px] leading-[1.5] text-book-muted">{card.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
