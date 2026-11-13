import Image from "next/image";
import Link from "next/link";
import { APP_PLAYBOOKS } from "@/lib/book/scottsdale";
import { Container, Eyebrow } from "@/app/book/_components/ui";
import { APPS, FOOTER, HERO, PRICING, SAMPLE, WHAT } from "./copy";

const BUTTON =
  "inline-flex h-12 items-center justify-center rounded-md px-5 font-book-display text-[20px] font-extrabold tracking-[0.04em] transition focus-visible:outline-none focus-visible:ring-4";
const BUTTON_YELLOW = `${BUTTON} bg-book-yellow text-book-green hover:brightness-95 focus-visible:ring-book-yellow/50`;
const BUTTON_GREEN = `${BUTTON} bg-book-green text-book-cream hover:brightness-110 focus-visible:ring-book-green/30`;
const PAGE_CLASS = "h-auto w-[31%] max-w-[190px] rounded shadow-[0_12px_28px_rgba(20,28,23,0.22)]";

export function Header() {
  return (
    <header className="bg-book-green text-book-cream">
      <Container className="flex items-center py-2.5">
        <Link href="/" className="flex items-center gap-2.5 py-1.5">
          <Image src="/images/logo3d.png" alt="" width={30} height={30} className="rounded-lg" />
          <span className="font-book-display text-[20px] font-bold tracking-[0.12em] text-book-yellow">GOLF PLAYBOOK</span>
        </Link>
      </Container>
    </header>
  );
}

export function Hero() {
  return (
    <section className="bg-book-green pb-14 pt-10 text-book-cream md:pb-16 md:pt-14">
      <Container className="flex max-w-[860px] flex-col gap-4">
        <Eyebrow className="text-book-yellow">{HERO.eyebrow}</Eyebrow>
        <h1 className="text-[44px] font-extrabold leading-[0.98] sm:text-[60px]">{HERO.headline}</h1>
        <p className="max-w-[640px] text-[19px] leading-[1.5] text-book-pale">{HERO.subhead}</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="#preorder" className={`${BUTTON_YELLOW} h-14 text-[22px]`}>
            {HERO.cta}
          </a>
          <a
            href="#sample"
            className="inline-flex h-12 items-center py-2 text-[18px] font-semibold text-book-cream underline underline-offset-4 hover:text-book-yellow"
          >
            {HERO.sampleLink}
          </a>
        </div>
        <p className="text-[16px] text-book-mint">{HERO.priceLine}</p>
      </Container>
    </section>
  );
}

export function WhatIsInIt() {
  return (
    <section className="py-12 md:py-16">
      <Container className="flex max-w-[860px] flex-col gap-4">
        <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[40px]">{WHAT.headline}</h2>
        <ul className="flex flex-col gap-2.5 text-[18px] leading-[1.45]">
          {WHAT.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.55em] h-2 w-2 shrink-0 rounded-full bg-book-orange" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function Sample() {
  return (
    <section id="sample" className="scroll-mt-4 border-t border-book-line py-12 md:py-16">
      <Container className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[40px]">{SAMPLE.headline}</h2>
          <p className="text-[18px] leading-[1.5] text-book-muted">{SAMPLE.body}</p>
          <a href={SAMPLE.pdfHref} target="_blank" rel="noopener" className={`${BUTTON_GREEN} w-fit`}>
            {SAMPLE.button}
          </a>
          <p className="text-[14px] text-book-muted">{SAMPLE.note}</p>
        </div>
        <div className="flex w-full flex-1 justify-center gap-2.5">
          <Image src="/scottsdale/sample-p1.webp" width={468} height={770} alt={SAMPLE.coverAlt} sizes="(min-width: 1024px) 190px, 30vw" className={PAGE_CLASS} />
          <Image src="/scottsdale/sample-p2.webp" width={468} height={770} alt={SAMPLE.greenAlt} sizes="(min-width: 1024px) 190px, 30vw" className={PAGE_CLASS} />
          <Image src="/scottsdale/sample-p3.webp" width={468} height={770} alt={SAMPLE.mapAlt} sizes="(min-width: 1024px) 190px, 30vw" className={PAGE_CLASS} />
        </div>
      </Container>
    </section>
  );
}

export function PriceAndPickup() {
  return (
    <section className="border-t border-book-line bg-book-cream py-12 md:py-16">
      <Container className="flex max-w-[860px] flex-col gap-5">
        <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[40px]">{PRICING.headline}</h2>
        <dl className="flex flex-col divide-y divide-book-line rounded-md border border-book-line bg-book-paper">
          {PRICING.rows.map((row) => (
            <div key={row.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3.5">
              <dt className="w-[130px] font-book-display text-[20px] font-bold uppercase tracking-[0.08em] text-book-muted">{row.label}</dt>
              <dd className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-book-display text-[34px] font-extrabold leading-none text-book-green">{row.price}</span>
                <span className="text-[17px] text-book-muted">{row.note}</span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2 text-[18px] leading-[1.5]">
          <p className="font-semibold">{PRICING.pickup}</p>
          <p>{PRICING.pay}</p>
          <p data-placeholder className="text-[15px] text-book-orange">{PRICING.hoursPlaceholder}</p>
          <p className="font-semibold text-book-green">{PRICING.moneyBack}</p>
        </div>
      </Container>
    </section>
  );
}

export function AppPlaybooks() {
  return (
    <section className="border-t border-book-line py-12 md:py-16">
      <Container className="flex max-w-[860px] flex-col gap-4">
        <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[40px]">{APPS.headline}</h2>
        <p className="text-[18px] leading-[1.5] text-book-muted">{APPS.body}</p>
        <ol className="list-decimal pl-6 text-[18px] leading-[1.6]">
          {APPS.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {APP_PLAYBOOKS.map((app) =>
            app.href ? (
              <a key={app.course} href={app.href} className={BUTTON_GREEN}>
                {APPS.linkLabel(app.course)}
              </a>
            ) : (
              <span
                key={app.course}
                data-placeholder
                className="inline-flex min-h-12 items-center rounded-md border-2 border-dashed border-book-orange px-4 py-2 text-[17px] text-book-orange"
              >
                {APPS.placeholder(app.course)}
              </span>
            ),
          )}
        </div>
        <Link href="/get" className="w-fit py-2 text-[17px] font-semibold text-book-green underline underline-offset-4">
          {APPS.getApp}
        </Link>
      </Container>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-book-line py-7 text-[14px] text-book-muted">
      <Container>
        <p>{FOOTER.disclaimer}</p>
      </Container>
    </footer>
  );
}
