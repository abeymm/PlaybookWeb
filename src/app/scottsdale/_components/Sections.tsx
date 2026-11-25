import Image from "next/image";
import Link from "next/link";
import { APP_PLAYBOOKS, isPlaceholder } from "@/lib/book/scottsdale";
import { Container, Eyebrow } from "@/app/book/_components/ui";
import { CopyLinkButton } from "./CopyLinkButton";
import { APPS, FOOTER, HERO, PRICING, SAMPLE } from "./copy";

const BUTTON =
  "inline-flex h-12 items-center justify-center rounded-md px-5 font-book-display text-[20px] font-extrabold tracking-[0.04em] transition focus-visible:outline-none focus-visible:ring-4";
const BUTTON_YELLOW = `${BUTTON} bg-book-yellow text-book-green hover:brightness-95 focus-visible:ring-book-yellow/50`;
const BUTTON_GREEN = `${BUTTON} bg-book-green text-book-cream hover:brightness-110 focus-visible:ring-book-green/30`;
const PAGE_CLASS = "h-auto w-full max-w-[360px] rounded shadow-[0_12px_28px_rgba(20,28,23,0.22)]";

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
        <p className="max-w-[640px] text-[19px] leading-[1.5] text-book-pale">{HERO.sub}</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="#preorder" className={`${BUTTON_YELLOW} h-14 text-[22px]`}>
            {HERO.cta}
          </a>
          <a
            href="#hole"
            className="inline-flex h-12 items-center py-2 text-[18px] font-semibold text-book-cream underline underline-offset-4 hover:text-book-yellow"
          >
            {HERO.sampleLink}
          </a>
        </div>
      </Container>
    </section>
  );
}

type Picture = { src: string; width: number; height: number; alt: string };
type LabelLine = { label: string; text: string };

function Pic({ picture, className, sizes }: { picture: Picture; className: string; sizes: string }) {
  return (
    <Image src={picture.src} width={picture.width} height={picture.height} alt={picture.alt} sizes={sizes} className={className} />
  );
}

function LabelLines({ lines }: { lines: readonly LabelLine[] }) {
  return (
    <div className="flex flex-col gap-2 text-[18px] leading-[1.45]">
      {lines.map((line) => (
        <p key={line.label}>
          <strong className="font-bold">{line.label}</strong> {line.text}
        </p>
      ))}
    </div>
  );
}

export function Sample() {
  const { tee, green } = SAMPLE;
  return (
    <section id="hole" className="scroll-mt-4 border-t border-book-line py-12 md:py-16">
      <Container className="flex max-w-[860px] flex-col gap-4">
        <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[40px]">{SAMPLE.headline}</h2>
        <h3 className="mt-4 text-[26px] font-extrabold leading-none text-book-green">{tee.subhead}</h3>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-center">
          <Pic picture={tee.pictures[0]} sizes="(min-width: 640px) 250px, 360px" className={`${PAGE_CLASS} sm:max-w-[250px]`} />
          <div className="flex w-full max-w-[400px] flex-col gap-4">
            <Pic picture={tee.pictures[1]} sizes="400px" className={PAGE_CLASS.replace("max-w-[360px]", "max-w-[400px]")} />
            <LabelLines lines={tee.lines} />
          </div>
        </div>
        <h3 className="mt-6 text-[26px] font-extrabold leading-none text-book-green">{green.subhead}</h3>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="flex w-full max-w-[400px] flex-col">
            <Pic picture={green.picture} sizes="400px" className={PAGE_CLASS.replace("max-w-[360px]", "max-w-[400px]")} />
          </div>
          <div className="flex flex-col gap-2">
            <LabelLines lines={green.uses} />
            <p className="text-[15px] text-book-muted">{green.localRules}</p>
          </div>
        </div>
        <p className="mt-2 text-[18px] leading-[1.5]">{SAMPLE.allHoles}</p>
        <a href={SAMPLE.pdfHref} target="_blank" rel="noopener" className={`${BUTTON_GREEN} w-fit`}>
          {SAMPLE.button}
        </a>
      </Container>
    </section>
  );
}

/** The price, pickup and money-back lines, shown above the pre-order form. */
export function PriceLines() {
  return (
    <div className="flex flex-col gap-2 text-[18px] leading-[1.5]">
      {PRICING.rows.map((row) => (
        <p key={row.label}>
          <strong className="font-bold">{row.label}</strong> {row.text}
        </p>
      ))}
      {isPlaceholder(PRICING.hoursPlaceholder) ? null : <p>{PRICING.hoursPlaceholder}</p>}
    </div>
  );
}

/** The one-time price line, with the store price struck through. */
export function IntroLine() {
  const { before, price, srNote } = PRICING.introLine;
  return (
    <p className="text-[15px] text-book-muted">
      {before} <s>{price}</s>.<span className="sr-only"> {srNote}</span>
    </p>
  );
}

export function AppPlaybooks() {
  return (
    <section className="border-t border-book-line py-12 md:py-16">
      <Container className="flex max-w-[860px] flex-col gap-4">
        <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[40px]">{APPS.headline}</h2>
        <div className="flex flex-col gap-1 text-[18px] leading-[1.5] text-book-muted">
          {APPS.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          {APP_PLAYBOOKS.map((app) => (
            <div key={app.course} className="flex flex-1 items-center gap-4 rounded-md border-2 border-book-line p-3">
              <Image src={app.qr} alt={APPS.qrAlt(app.course)} width={120} height={120} unoptimized className="h-[120px] w-[120px] shrink-0" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="w-full text-[22px] font-extrabold leading-none text-book-green">{app.course}</h3>
                <a href={app.href} className="py-2 text-[17px] font-semibold text-book-green underline underline-offset-4">
                  {APPS.linkLabel(app.course)}
                </a>
                <CopyLinkButton
                  href={app.href}
                  label={APPS.copyLink}
                  doneLabel={APPS.copied}
                  failLabel={APPS.copyFailed}
                  className="h-10 rounded-md border-2 border-book-green px-3 text-[16px] font-semibold text-book-green hover:bg-book-green/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-book-green/30"
                />
              </div>
            </div>
          ))}
        </div>
        <Link href={APPS.getAppHref} className="w-fit py-2 text-[17px] font-semibold text-book-green underline underline-offset-4">
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
