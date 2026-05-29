"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BlurFade } from "@/components/ui/blur-fade";
import { ProtectedEmail } from "@/components/ui/protected-email";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MegaphoneIcon,
  BookOpenIcon,
  MapPinIcon,
  WindIcon,
  TableIcon,
  ImageIcon,
  UsersIcon,
  HeartHandshakeIcon,
  MailIcon,
} from "lucide-react";

const howItWorks = [
  {
    step: 1,
    title: "Share Your Event Details",
    description:
      "Tell us your course, date, and player count. We'll create a custom playbook tailored to your tournament.",
  },
  {
    step: 2,
    title: "Add Sponsor Ads (Optional)",
    description:
      "Offset costs or generate revenue with premium ad placements in every book.",
  },
  {
    step: 3,
    title: "We Print & Ship",
    description:
      "Professional pocket-sized booklets delivered to your event, ready to hand out.",
  },
];

const whatIsIncluded = [
  { icon: MapPinIcon, text: "Hole-by-hole strategy with distances" },
  { icon: BookOpenIcon, text: "Hazard avoidance & miss zones" },
  { icon: WindIcon, text: "Wind compensation chart" },
  { icon: TableIcon, text: "Scorecard" },
  { icon: ImageIcon, text: "Tournament & course branding" },
  { icon: MegaphoneIcon, text: "Sponsor ads (if applicable)" },
];

const artStyles = [
  {
    name: "Watercolor",
    image: "/images/print/samples/waterColor.jpeg",
    description: "Elegant hand-painted aesthetic",
  },
  {
    name: "Color Pencil",
    image: "/images/print/samples/colorPencil.jpeg",
    description: "Classic illustrated style",
  },
  {
    name: "Futuristic",
    image: "/images/print/samples/futuristic.jpeg",
    description: "Bold neon and modern lines",
  },
  {
    name: "3D Claymation",
    image: "/images/print/samples/fun3D.jpeg",
    description: "Playful dimensional look",
  },
];

const sponsorPlacements = [
  {
    name: "Cover Sponsor",
    description: "Logo prominently displayed on the front cover of every playbook",
  },
  {
    name: "Inside Front Cover",
    description: "Full-page premium ad placement seen first when opened",
  },
  {
    name: "On-Course Offers",
    description: "F&B specials, beer cart promotions, and course amenities",
  },
  {
    name: "Back Cover",
    description: "Merchandise, local businesses, and event sponsors",
  },
];

const pricingOptions = [
  {
    icon: UsersIcon,
    name: "Player-Funded",
    price: "$15-20",
    description: "per player (volume discounts available)",
    detail: "Include in registration or sell separately.",
  },
  {
    icon: MegaphoneIcon,
    name: "Sponsor-Funded",
    price: "Free",
    description: "to players",
    detail: "We sell ad placements; you keep a portion of sponsor revenue.",
  },
  {
    icon: HeartHandshakeIcon,
    name: "Hybrid",
    price: "Custom",
    description: "pricing",
    detail: "Combine player fees + sponsor revenue to maximize value.",
  },
];

const faqs = [
  {
    question: "How long does it take to create tournament playbooks?",
    answer:
      "We typically need 2-3 weeks lead time before your event. Rush orders (1 week) are available for an additional fee.",
  },
  {
    question: "What size are the playbooks?",
    answer:
      "Pocket-sized for easy use on the course, and fully compliant with USGA rules for green-reading materials.",
  },
  {
    question: "Can we customize the design with our tournament branding?",
    answer:
      "Absolutely! We include your tournament logo, colors, and branding throughout the playbook at no extra charge.",
  },
  {
    question: "What's the minimum order?",
    answer:
      "Minimum order is 50 playbooks. This ensures we can offer competitive pricing while maintaining premium quality.",
  },
  {
    question: "Do you handle sponsor outreach?",
    answer:
      "For sponsor-funded options, we can help identify and reach out to potential sponsors, or work with sponsors you&apos;ve already secured.",
  },
];

export default function TournamentsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo3d.png"
              alt="Golf Playbook"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-xl font-bold tracking-tight">Golf Playbook</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button size="sm" asChild>
              <a href="#quote">Request a Quote</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <Badge variant="secondary" className="mb-4">
                  For Tournament Directors
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Give Every Player a Book Worth Keeping
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  A pocket-sized strategy playbook in your tournament&apos;s colors—the
                  kind players show off, not toss. Sponsored by your partners or
                  included in registration.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <ShimmerButton
                    className="h-12 px-8"
                    background="#F5C518"
                    onClick={() => document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    <span className="flex items-center gap-2 text-base font-semibold text-[#000000]">
                      Request a Quote
                      <ArrowRightIcon className="h-4 w-4" />
                    </span>
                  </ShimmerButton>
                  <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                    <Link
                      href="/images/print/samples/SampleYardagePebble.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      See Sample Playbook
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border border-border/50 bg-muted/30 shadow-2xl">
                  <Image
                    src="/images/print/samples/hole-strategy.jpg"
                    alt="Sample tournament playbook page showing hole strategy"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-sm font-medium text-white">
                      Sample Playbook Page
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-y border-border/40 bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-4">
                How It Works
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                From your event details to players&apos; hands
              </h2>
              <p className="mt-4 text-muted-foreground">
                Three steps and a few weeks of lead time. We handle design, print,
                and delivery.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <ol className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-3">
              {howItWorks.map((item) => (
                <li key={item.step} className="border-t-2 border-primary/30 pt-5">
                  <span className="font-display text-5xl font-semibold leading-none tabular-nums md:text-6xl">
                    {String(item.step).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.description}</p>
                </li>
              ))}
            </ol>
          </BlurFade>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <Badge variant="secondary" className="mb-4">
                  What's Included
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  What Every Player Gets
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Professional-quality playbooks packed with everything players need for
                  smart course management.
                </p>
                <ul className="mt-8 space-y-4">
                  {whatIsIncluded.map((item) => (
                    <li key={item.text} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="overflow-hidden rounded-xl border border-border/50">
                  <Image
                    src="/images/print/samples/hole-strategy.jpg"
                    alt="Hole strategy page example"
                    width={400}
                    height={700}
                    className="w-full h-auto"
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-border/50">
                  <Image
                    src="/images/print/samples/dispersion-feature.jpg"
                    alt="Dispersion planning feature"
                    width={400}
                    height={250}
                    className="w-full h-auto"
                  />
                  <div className="overflow-hidden border-t border-border/50">
                    <Image
                      src="/images/print/samples/on-course-offer.jpg"
                      alt="On-course sponsor offer example"
                      width={400}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Premium Art Styles Section */}
      <section className="border-y border-border/40 bg-gradient-to-br from-primary/5 via-background to-background px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge className="mb-4 bg-primary text-primary-foreground">
                Premium Upgrade
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Make Your Playbooks Unforgettable
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Want your playbooks to stand out? Choose from premium art styles—watercolor,
                neon, illustrated—for a truly unique player experience.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {artStyles.map((style, index) => (
                <Card
                  key={style.name}
                  className="group overflow-hidden border-border/50 transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="relative h-80 overflow-hidden">
                    <div
                      className="animate-slow-pan"
                      style={{
                        animationDelay: `${(index + 1) * 2}s`,
                      }}
                    >
                      <Image
                        src={style.image}
                        alt={`${style.name} art style example`}
                        width={400}
                        height={800}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold">{style.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {style.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </BlurFade>

          <BlurFade delay={0.3}>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Premium art styles available for an additional fee. Ask us for details when
                requesting your quote.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Sponsor Placements Section */}
      <section className="bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Sponsorship
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Premium Sponsor Visibility
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Turn playbooks into a revenue stream. Sponsors reach every player, on every
                hole, all round long.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {sponsorPlacements.map((placement) => (
                <Card key={placement.name} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{placement.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{placement.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </BlurFade>

          <BlurFade delay={0.3}>
            <div className="mt-12 text-center">
              <ShimmerButton
                className="h-12 px-8"
                background="#F5C518"
                onClick={() => document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" })}
              >
                <span className="flex items-center gap-2 text-base font-semibold text-[#000000]">
                  Request a Quote
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </ShimmerButton>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Pricing
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Flexible Pricing Options
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Choose the model that works best for your tournament.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {pricingOptions.map((option) => (
                <Card
                  key={option.name}
                  className="relative overflow-hidden border-border/50"
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <option.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="mt-4">{option.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">{option.price}</span>
                      <span className="text-sm text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{option.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </BlurFade>

          <BlurFade delay={0.3}>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Minimum order: 50 playbooks. Pricing varies by course complexity and
                customization.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-y border-border/40 bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                FAQ
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                  {index < faqs.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Contact Section */}
      <section id="quote" className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <BlurFade delay={0.1}>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
              <CardContent className="p-8 text-center md:p-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <MailIcon className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight md:text-3xl">
                  Interested?
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Email <ProtectedEmail d="dG91cm5hbWVudHM=" /> to request a quote for your event.
                </p>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border/40 bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-muted-foreground">
            Have questions? Email <ProtectedEmail d="dG91cm5hbWVudHM=" />.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo3d.png"
                alt="Golf Playbook"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold tracking-tight">Golf Playbook</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/for-courses" className="transition-colors hover:text-foreground">
                Courses
              </Link>
              <Link href="/partners" className="transition-colors hover:text-foreground">
                Partners
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">
                Terms
              </Link>
              <Link href="/support" className="transition-colors hover:text-foreground">
                Support
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Golf Playbook. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
