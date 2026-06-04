"use client";

import Link from "next/link";
import Image from "next/image";
import { BlurFade } from "@/components/ui/blur-fade";
import { ProtectedEmail } from "@/components/ui/protected-email";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, MailIcon } from "lucide-react";

/* Fixed collateral palette — renders the same in light or dark theme. */
const GREEN = "#08401B";
const GOLD = "#F5C518";
const GOLD_DEEP = "#B8860B";
const CREAM = "#F5F1E6";
const WHITE = "#FFFFFF";
const INK = "#14241A";
const INK_SOFT = "#46514A";
const CREAM_MUTED = "#D7DDCB";
const RULE = "rgba(8,64,27,0.14)";

const playerGets = [
  "Hole-by-hole strategy with distances",
  "Hazard and miss zones, color-coded",
  "Wind compensation chart",
  "A scorecard worth keeping",
  "Your tournament and course branding",
];

const steps = [
  { n: "1", title: "Share", description: "Tell us your course, date, and field size." },
  { n: "2", title: "Design", description: "We build a custom playbook; you approve a proof." },
  { n: "3", title: "Deliver", description: "Pocket books printed and shipped to your event." },
];

const funding = [
  { name: "Player-funded", description: "Include in registration, or sell at the event." },
  { name: "Sponsor-funded", description: "Your event's sponsors cover it; players pay nothing." },
  { name: "Hybrid", description: "A mix of both — sponsor logos offset the player price." },
];

const artStyles = [
  { name: "Watercolor", image: "/images/print/samples/waterColor.jpeg" },
  { name: "Color Pencil", image: "/images/print/samples/colorPencil.jpeg" },
  { name: "Futuristic", image: "/images/print/samples/futuristic.jpeg" },
  { name: "3D Claymation", image: "/images/print/samples/fun3D.jpeg" },
];

export default function TournamentsPage() {
  return (
    <div style={{ backgroundColor: WHITE, color: INK }} className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ backgroundColor: "rgba(255,255,255,0.85)", borderBottom: `1px solid ${RULE}` }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo3d.png" alt="Golf Playbook" width={36} height={36} className="rounded-xl" />
            <span className="text-xl font-bold tracking-tight" style={{ color: INK }}>Golf Playbook</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/" className="hidden items-center gap-2 text-sm font-medium sm:flex" style={{ color: INK_SOFT }}>
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Home
            </Link>
            <a href="#contact" className="flex h-9 items-center rounded-lg px-4 text-sm font-semibold" style={{ backgroundColor: GOLD, color: "#000" }}>
              Request a Quote
            </a>
          </div>
        </div>
      </header>

      {/* Hero — forest green */}
      <section className="px-6 py-24 md:py-32" style={{ backgroundColor: GREEN, color: CREAM }}>
        <div className="mx-auto max-w-4xl text-center">
          <BlurFade delay={0.1}>
            <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>For Tournament Directors</p>
            <h1 className="mt-6 text-4xl leading-[1.05] tracking-tight md:text-6xl" style={{ color: CREAM }}>
              A book worth keeping — for your event.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg" style={{ color: CREAM_MUTED }}>
              A printed strategy playbook in your event&apos;s colors. Hand one to every player.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="#contact" className="flex h-12 items-center gap-2 rounded-lg px-8 text-base font-semibold transition-transform hover:scale-[1.02]" style={{ backgroundColor: GOLD, color: "#000" }}>
                Request a Quote
                <ArrowRightIcon className="h-4 w-4" />
              </a>
              <Link href="/images/print/samples/SampleYardagePebble.pdf" target="_blank" rel="noopener noreferrer" className="flex h-12 items-center rounded-lg border px-8 text-base font-medium" style={{ borderColor: "rgba(245,197,24,0.5)", color: CREAM }}>
                See a sample
              </Link>
            </div>
            <p className="mt-12 font-display text-lg italic" style={{ color: "rgba(245,241,230,0.65)" }}>Plan it. Play it. Keep it.</p>
          </BlurFade>
        </div>
      </section>

      {/* What every player gets */}
      <section className="px-6 py-20" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
          <BlurFade delay={0.1}>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_DEEP }}>What every player gets</p>
              <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: GREEN }}>Everything they need for a smart round.</h2>
              <ul className="mt-8 space-y-3">
                {playerGets.map((t) => (
                  <li key={t} className="flex items-start gap-3" style={{ color: INK_SOFT }}>
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD_DEEP }} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <div className="overflow-hidden rounded-2xl shadow-sm" style={{ border: `1px solid ${RULE}` }}>
              <Image src="/images/print/samples/hole-strategy.jpg" alt="Sample tournament playbook page" width={800} height={1000} className="h-auto w-full" />
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Art styles */}
      <section className="px-6 py-20" style={{ backgroundColor: CREAM }}>
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_DEEP }}>Make it unforgettable</p>
              <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: GREEN }}>Choose the look for your holes.</h2>
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {artStyles.map((style) => (
                <div key={style.name} className="overflow-hidden rounded-xl shadow-sm" style={{ backgroundColor: WHITE, border: `1px solid ${RULE}` }}>
                  <div className="relative h-72 overflow-hidden">
                    <Image src={style.image} alt={`${style.name} hole art`} width={400} height={600} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-base" style={{ color: GREEN }}>{style.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20" style={{ backgroundColor: GREEN, color: CREAM }}>
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>How it works</p>
              <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: CREAM }}>From your event details to players&apos; hands.</h2>
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <ol className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="pt-5" style={{ borderTop: "1px solid rgba(245,197,24,0.35)" }}>
                  <span className="font-display text-5xl" style={{ color: GOLD }}>{s.n}</span>
                  <h3 className="mt-4 text-xl" style={{ color: CREAM }}>{s.title}</h3>
                  <p className="mt-2" style={{ color: "#C7CFBA" }}>{s.description}</p>
                </li>
              ))}
            </ol>
          </BlurFade>
        </div>
      </section>

      {/* Tournament Ready Mode */}
      <section className="px-6 py-20" style={{ backgroundColor: CREAM }}>
        <div className="mx-auto max-w-3xl text-center">
          <BlurFade delay={0.1}>
            <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_DEEP }}>Tournament Ready Mode</p>
            <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: GREEN }}>Built for competition.</h2>
            <p className="mx-auto mt-4 max-w-xl" style={{ color: INK_SOFT }}>
              Competitions don&apos;t allow live weather compensation — so the app
              turns it off. The printed book carries what you can bring: aim lines,
              a wind chart, and slope, right in the player&apos;s hand.
            </p>
          </BlurFade>
        </div>
      </section>

      {/* Funding */}
      <section className="px-6 py-20" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_DEEP }}>How it gets funded</p>
              <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: GREEN }}>Three ways to pay for it.</h2>
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {funding.map((f) => (
                <div key={f.name} className="rounded-xl p-6" style={{ border: `1px solid ${RULE}`, backgroundColor: WHITE }}>
                  <h3 className="text-xl" style={{ color: GREEN }}>{f.name}</h3>
                  <p className="mt-2" style={{ color: INK_SOFT }}>{f.description}</p>
                </div>
              ))}
            </div>
          </BlurFade>
          <BlurFade delay={0.3}>
            <p className="mt-10 text-sm" style={{ color: INK_SOFT }}>
              Pocket-sized for easy use on the course. Minimum 50 books — usually one per player, plus spares for sponsors and staff.
            </p>
          </BlurFade>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-6 py-20" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto max-w-2xl text-center">
          <BlurFade delay={0.1}>
            <div className="rounded-2xl px-8 py-12 md:px-12" style={{ backgroundColor: GREEN, color: CREAM }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(245,197,24,0.2)" }}>
                <MailIcon className="h-8 w-8" style={{ color: GOLD }} />
              </div>
              <h2 className="mt-6 text-2xl tracking-tight md:text-3xl" style={{ color: CREAM }}>Get a quote for your event.</h2>
              <p className="mt-4" style={{ color: CREAM_MUTED }}>
                Email <ProtectedEmail d="dG91cm5hbWVudHM=" /> with your course, date, and field size.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12" style={{ backgroundColor: WHITE, borderTop: `1px solid ${RULE}` }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/images/logo3d.png" alt="Golf Playbook" width={32} height={32} className="rounded-lg" />
              <span className="text-lg font-bold tracking-tight" style={{ color: INK }}>Golf Playbook</span>
            </div>
            <div className="flex items-center gap-6 text-sm" style={{ color: INK_SOFT }}>
              <Link href="/for-courses" className="hover:underline">Courses</Link>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
              <Link href="/support" className="hover:underline">Support</Link>
            </div>
            <p className="text-sm" style={{ color: INK_SOFT }}>&copy; {new Date().getFullYear()} Golf Playbook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
