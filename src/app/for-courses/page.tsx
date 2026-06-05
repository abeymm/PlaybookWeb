"use client";

import Link from "next/link";
import Image from "next/image";
import { BlurFade } from "@/components/ui/blur-fade";
import { ProtectedEmail } from "@/components/ui/protected-email";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, MailIcon } from "lucide-react";

/* Fixed collateral palette — these pages render the same in light or dark theme. */
const GREEN = "#08401B";
const GOLD = "#F5C518";
const GOLD_DEEP = "#B8860B";
const CREAM = "#F5F1E6";
const WHITE = "#FFFFFF";
const INK = "#14241A";
const INK_SOFT = "#46514A";
const CREAM_MUTED = "#D7DDCB";
const RULE = "rgba(8,64,27,0.14)";

const whatItIs = [
  { title: "Your strategy", description: "Hole-by-hole, built in the app with your Head Pro. Where to aim, what to avoid." },
  { title: "Your art", description: "Choose the look for every hole — watercolor, pencil, futuristic, or 3D." },
  { title: "Your brand, plus the app", description: "Your cover, your colors, and a free companion app that carries the same plan." },
];

const steps = [
  { n: "1", title: "Design", description: "We build your strategy in the app with your Head Pro." },
  { n: "2", title: "Style", description: "Pick the art for your holes — the looks shown in the book." },
  { n: "3", title: "Sample", description: "We print a proof of your pages for you to approve." },
  { n: "4", title: "Batch", description: "Greenlight it — your first run is 100 books." },
];

const artStyles = [
  { name: "Watercolor", image: "/images/print/samples/waterColor.jpeg" },
  { name: "Pencil Sketch", image: "/images/print/samples/colorPencil.jpeg" },
  { name: "Neon", image: "/images/print/samples/futuristic.jpeg" },
  { name: "Oil", image: "/images/print/samples/fun3D.jpeg" },
];

const golferGets = [
  "A free app — no fee, no subscription",
  "Clean by default, or carrying only your promos",
  "Works offline, on every hole",
  "Smarter rounds, lower scores",
];

const courseGets = [
  "A premium book you sell at your own price",
  "A keepsake that brings golfers back",
  "Free content updates when your course changes",
  "Print-ready QR posters for the pro shop",
];

export default function ForCoursesPage() {
  return (
    <div style={{ backgroundColor: WHITE, color: INK }} className="min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.85)", borderBottom: `1px solid ${RULE}` }}
      >
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
            <a
              href="#contact"
              className="flex h-9 items-center rounded-lg px-4 text-sm font-semibold"
              style={{ backgroundColor: GOLD, color: "#000" }}
            >
              Request a Sample
            </a>
          </div>
        </div>
      </header>

      {/* Hero — forest green */}
      <section className="px-6 py-24 md:py-32" style={{ backgroundColor: GREEN, color: CREAM }}>
        <div className="mx-auto max-w-4xl text-center">
          <BlurFade delay={0.1}>
            <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>For Golf Courses</p>
            <h1 className="mt-6 text-4xl leading-[1.05] tracking-tight md:text-6xl" style={{ color: CREAM }}>
              The yardage book, reborn — for your course.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg" style={{ color: CREAM_MUTED }}>
              A free app for your golfers. Premium branded books you sell at your price.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="#contact" className="flex h-12 items-center gap-2 rounded-lg px-8 text-base font-semibold transition-transform hover:scale-[1.02]" style={{ backgroundColor: GOLD, color: "#000" }}>
                Request a Sample
                <ArrowRightIcon className="h-4 w-4" />
              </a>
              <a href="#pilot" className="flex h-12 items-center rounded-lg border px-8 text-base font-medium" style={{ borderColor: "rgba(245,197,24,0.5)", color: CREAM }}>
                How the pilot works
              </a>
            </div>
            <p className="mt-12 font-display text-lg italic" style={{ color: "rgba(245,241,230,0.65)" }}>Plan it. Play it. Keep it.</p>
          </BlurFade>
        </div>
      </section>

      {/* What it is */}
      <section className="px-6 py-20" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_DEEP }}>What it is</p>
              <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: GREEN }}>A premium book, made for your layout.</h2>
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {whatItIs.map((item) => (
                <div key={item.title} className="pt-5" style={{ borderTop: `2px solid ${RULE}` }}>
                  <h3 className="text-xl" style={{ color: GREEN }}>{item.title}</h3>
                  <p className="mt-2" style={{ color: INK_SOFT }}>{item.description}</p>
                </div>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Art styles */}
      <section className="px-6 py-20" style={{ backgroundColor: CREAM }}>
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_DEEP }}>Every hole, drawn beautifully</p>
              <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: GREEN }}>Pick the look that fits your course.</h2>
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {artStyles.map((style) => (
                <div key={style.name} className="overflow-hidden rounded-xl shadow-sm" style={{ backgroundColor: WHITE, border: `1px solid ${RULE}` }}>
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image src={style.image} alt={`${style.name} hole art`} width={400} height={600} className="h-full w-full object-cover object-top" />
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

      {/* How the pilot works */}
      <section id="pilot" className="px-6 py-20" style={{ backgroundColor: GREEN, color: CREAM }}>
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>How the pilot works</p>
              <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: CREAM }}>Four steps to your first box.</h2>
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <li key={s.n} className="pt-5" style={{ borderTop: "1px solid rgba(245,197,24,0.35)" }}>
                  <span className="font-display text-5xl" style={{ color: GOLD }}>{s.n}</span>
                  <h3 className="mt-4 text-xl" style={{ color: CREAM }}>{s.title}</h3>
                  <p className="mt-2" style={{ color: "#C7CFBA" }}>{s.description}</p>
                </li>
              ))}
            </ol>
          </BlurFade>
          <BlurFade delay={0.3}>
            <p className="mt-10 text-sm" style={{ color: "rgba(245,241,230,0.7)" }}>
              <span style={{ color: GOLD, fontWeight: 600 }}>Steps 1–3 are free.</span> You only commit once you have seen your own pages.
            </p>
          </BlurFade>
        </div>
      </section>

      {/* Two sides of value */}
      <section className="px-6 py-20" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <BlurFade delay={0.1}>
            <div>
              <h2 className="text-2xl tracking-tight md:text-3xl" style={{ color: GREEN }}>Your golfers get</h2>
              <ul className="mt-6 space-y-3">
                {golferGets.map((t) => (
                  <li key={t} className="flex items-start gap-3" style={{ color: INK_SOFT }}>
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD_DEEP }} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <div>
              <h2 className="text-2xl tracking-tight md:text-3xl" style={{ color: GREEN }}>You get</h2>
              <ul className="mt-6 space-y-3">
                {courseGets.map((t) => (
                  <li key={t} className="flex items-start gap-3" style={{ color: INK_SOFT }}>
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD_DEEP }} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Wholesale framing — no numbers */}
      <section className="px-6 py-20" style={{ backgroundColor: CREAM }}>
        <div className="mx-auto max-w-3xl text-center">
          <BlurFade delay={0.1}>
            <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_DEEP }}>Simple terms</p>
            <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: GREEN }}>You set the price. You keep the margin.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg" style={{ color: INK_SOFT }}>
              Buy at wholesale, set your own retail, keep what you make. No platform fee, no subscription — you only pay for the books you order. First runs start at a 100-book minimum.
            </p>
          </BlurFade>
        </div>
      </section>

      {/* Founding courses — honest scarcity */}
      <section className="px-6 py-20" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto max-w-3xl">
          <BlurFade delay={0.1}>
            <div className="rounded-2xl px-8 py-10 text-center md:px-12" style={{ border: `2px solid ${GOLD}`, backgroundColor: "rgba(245,197,24,0.06)" }}>
              <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_DEEP }}>Founding Courses</p>
              <h2 className="mt-4 text-3xl tracking-tight md:text-4xl" style={{ color: GREEN }}>We are onboarding a handful of courses this season.</h2>
              <p className="mx-auto mt-4 max-w-xl" style={{ color: INK_SOFT }}>
                Every playbook is hand-built with your Head Pro, so we take on a limited number of founding courses at a time. Founding partners get their design built free and lock in founding pricing on reorders.
              </p>
              <a href="#contact" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg px-8 text-base font-semibold transition-transform hover:scale-[1.02]" style={{ backgroundColor: GOLD, color: "#000" }}>
                Claim a founding spot
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            </div>
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
              <h2 className="mt-6 text-2xl tracking-tight md:text-3xl" style={{ color: CREAM }}>Let&apos;s build yours.</h2>
              <p className="mt-4" style={{ color: CREAM_MUTED }}>
                Email <ProtectedEmail d="Y291cnNlcw==" /> for a sample and a walkthrough — design and sample are free.
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
              <Link href="/for-tournaments" className="hover:underline">Tournaments</Link>
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
