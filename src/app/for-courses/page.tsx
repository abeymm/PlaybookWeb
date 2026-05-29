"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BlurFade } from "@/components/ui/blur-fade";
import { ProtectedEmail } from "@/components/ui/protected-email";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  QrCodeIcon,
  SmartphoneIcon,
  PaletteIcon,
  UtensilsIcon,
  GiftIcon,
  BarChartIcon,
  PrinterIcon,
  MailIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react";

const howItWorks = [
  {
    step: 1,
    title: "We Build Your Playbook",
    description:
      "Work with your Head Pro to create custom hole-by-hole strategy, hazard guidance, and course tips tailored to your layout.",
  },
  {
    step: 2,
    title: "Players Scan & Play",
    description:
      "Display QR codes in the pro shop and on scorecards. Players scan to instantly access your branded digital playbook.",
  },
  {
    step: 3,
    title: "Engage & Convert",
    description:
      "Reach players with on-course F&B offers and post-round promotions. Turn every round into a return visit.",
  },
];

const whatsIncluded = [
  {
    icon: SmartphoneIcon,
    title: "Custom Course Playbook",
    description:
      "Hole-by-hole strategy with distances, hazards, and miss zones created with your Head Pro.",
  },
  {
    icon: PaletteIcon,
    title: "Premium App Theme",
    description:
      "Your playbook displayed in a custom theme matching your course branding and aesthetic.",
  },
  {
    icon: QrCodeIcon,
    title: "Pro Shop QR Display",
    description:
      "Ready-to-print QR poster and table tents for your pro shop and starter station.",
  },
  {
    icon: UtensilsIcon,
    title: "On-Course Offers",
    description:
      "Promote F&B specials, beer cart deals, and course amenities directly to players during their round.",
  },
  {
    icon: GiftIcon,
    title: "Off-Course Promotions",
    description:
      "Send tee time offers, merchandise deals, and loyalty rewards to bring players back.",
  },
  {
    icon: BarChartIcon,
    title: "Player Analytics",
    description:
      "See how many players access your playbook, view offers, and engage with promotions.",
  },
  {
    icon: PrinterIcon,
    title: "Printed Books at Partner Pricing",
    description:
      "Order professional printed yardage books at $14.99/book to sell in your pro shop.",
  },
  {
    icon: RefreshCwIcon,
    title: "Annual Updates Included",
    description:
      "Course renovations? Seasonal changes? We update your playbook at no extra charge.",
  },
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
];

const faqs = [
  {
    question: "How long does it take to create a course playbook?",
    answer:
      "We typically complete new playbooks within 2-3 weeks of our initial consultation with your Head Pro. This includes strategy development, design, and review cycles.",
  },
  {
    question: "What's included in the annual partnership?",
    answer:
      "Everything: custom playbook creation, premium app theme, QR materials, on-course and off-course offer management, player analytics, and unlimited updates throughout the year.",
  },
  {
    question: "How do players access the playbook?",
    answer:
      "Players scan a QR code in your pro shop or on scorecards. They can access instantly via web browser or download the Golf Playbook app for offline access with enhanced features.",
  },
  {
    question: "Can we update offers and promotions ourselves?",
    answer:
      "Yes! You'll have access to a partner dashboard where you can create, schedule, and manage all on-course and off-course offers. Changes go live instantly.",
  },
  {
    question: "What if our course layout changes?",
    answer:
      "Annual updates are included at no extra cost. Whether it's a full renovation or seasonal pin positions, we'll update your playbook to reflect the changes.",
  },
  {
    question: "How do printed yardage books work?",
    answer:
      "As a partner, you can order printed playbooks at our partner price of $14.99/book (minimum 50). Sell them in your pro shop for $24.99+ and keep the profit.",
  },
];

export default function ForCoursesPage() {
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
              <a href="#lead-form">Request a Demo</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                For Golf Courses
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Turn Every Round Into a Return Visit
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Give your members a premium strategy tool—free to them, fully branded to
                you—that keeps them engaged from the first tee to the 19th hole and brings
                them back for more.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <ShimmerButton
                  className="h-12 px-8"
                  background="#F5C518"
                  onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <span className="flex items-center gap-2 text-base font-semibold text-[#000000]">
                    Request a Demo
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </ShimmerButton>
                <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="border-y border-border/40 bg-muted/30 px-6 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-4">
                How It Works
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                From layout to loyalty, in three moves
              </h2>
              <p className="mt-4 text-muted-foreground">
                We do the heavy lifting. You connect with players from the first tee
                to the parking lot.
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
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                What&apos;s Included
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Everything You Need to Engage Players
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                A complete platform for player engagement, from digital playbooks to
                promotional tools.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {whatsIncluded.map((item) => (
                <Card key={item.title} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-4 font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* QR Code Section */}
      <section className="border-y border-border/40 bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="flex justify-center">
                <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 p-8 shadow-lg">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <QrCodeIcon className="h-24 w-24 text-primary/60" />
                    <p className="mt-6 text-lg font-semibold">Scan to Play Smarter</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your Course Name Here
                    </p>
                    <div className="mt-6 flex items-center gap-2 rounded-full bg-background/80 px-4 py-2">
                      <Image
                        src="/images/logo3d.png"
                        alt="Golf Playbook"
                        width={20}
                        height={20}
                        className="rounded"
                      />
                      <span className="text-xs font-medium">Golf Playbook</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Badge variant="secondary" className="mb-4">
                  Easy Access
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  One Scan, Instant Strategy
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Place QR codes in your pro shop, on scorecards, or at the starter
                  station. Players scan once and have instant access to your custom
                  playbook.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>Free for your players—no fees, no subscription</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>No app download required (works in browser)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>Optional app for offline access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>Track engagement and scan analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>We provide print-ready materials</span>
                  </li>
                </ul>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* On-Course & Off-Course Offers Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Drive Revenue
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Reach Players When It Matters
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Connect with players during their round and after they leave—turn casual
                golfers into loyal regulars.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <UtensilsIcon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">On-Course Offers</CardTitle>
                  <CardDescription>
                    Engage players during their round
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Beer cart specials and F&B promotions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Turn beverage cart happy hours
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Course amenity highlights
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Real-time push notifications
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <GiftIcon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Off-Course Promotions</CardTitle>
                  <CardDescription>
                    Bring players back for more
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Tee time offers and flash sales
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Pro shop merchandise deals
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Loyalty rewards and punch cards
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Event and tournament announcements
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Premium Themes Section */}
      <section className="border-y border-border/40 bg-gradient-to-br from-primary/5 via-background to-background px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge className="mb-4 bg-primary text-primary-foreground">
                <SparklesIcon className="mr-1 h-3 w-3" />
                Premium Feature
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Custom Art Themes
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Your playbook, your style. Choose from premium art themes to match your
                course&apos;s personality and brand.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {artStyles.map((style, index) => (
                <Card
                  key={style.name}
                  className="group overflow-hidden border-border/50 transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="relative h-64 overflow-hidden">
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
                        height={600}
                        className="h-auto w-full"
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
                Simple, All-Inclusive Partnership
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                One annual fee. Everything included. No hidden costs.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <Card className="mx-auto mt-12 max-w-md border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
              <CardHeader className="text-center">
                <CardTitle className="text-lg text-muted-foreground">
                  Annual Partnership
                </CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">$2,400</span>
                  <span className="text-lg text-muted-foreground">/year</span>
                </div>
                <CardDescription className="mt-2">
                  Everything you need to engage players and drive revenue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Separator className="mb-6" />
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>Custom playbook with Head Pro consultation</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>Premium branded app theme</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>QR codes and print materials</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>On-course and off-course offer system</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>Player analytics dashboard</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>Printed books at $14.99/book partner pricing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-primary" />
                    <span>Unlimited updates throughout the year</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <ShimmerButton
                  className="h-12 w-full"
                  background="#F5C518"
                  onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <span className="flex items-center justify-center gap-2 text-base font-semibold text-[#000000]">
                    Request a Demo
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </ShimmerButton>
              </CardFooter>
            </Card>
          </BlurFade>

          <BlurFade delay={0.3}>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Volume discounts available for course management groups. Contact us for
                details.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Tour-Level Pin Accuracy Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <BlurFade delay={0.1}>
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
              <CardContent className="p-8 md:p-12">
                <div className="grid gap-8 md:grid-cols-2 md:items-center">
                  <div>
                    <Badge className="mb-4 bg-primary text-primary-foreground">
                      <SparklesIcon className="mr-1 h-3 w-3" />
                      Optional Enhancement
                    </Badge>
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                      Tour-Level Pin Accuracy
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                      Take your playbook to the next level with daily pin positions and
                      professional green slope data—the same technology used on tour.
                    </p>
                  </div>
                  <div>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckIcon className="h-5 w-5 text-primary" />
                        <span>Daily pin position updates</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckIcon className="h-5 w-5 text-primary" />
                        <span>Green slope and break data</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckIcon className="h-5 w-5 text-primary" />
                        <span>Integration with mapping partners</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckIcon className="h-5 w-5 text-primary" />
                        <span>Real-time updates in player app</span>
                      </li>
                    </ul>
                    <Button className="mt-6" variant="outline" asChild>
                      <Link href="/partners">
                        Learn About Partner Integrations
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <div className="mt-12 space-y-0">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group border-b border-border/50 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between py-4 font-medium">
                    {faq.question}
                    <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                      <ArrowRightIcon className="h-4 w-4 rotate-90" />
                    </span>
                  </summary>
                  <p className="pb-4 text-sm text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Contact Section */}
      <section id="lead-form" className="px-6 py-20">
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
                  Email <ProtectedEmail d="Y291cnNlcw==" /> to start a conversation about partnering with Golf Playbook.
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
            Have questions? Email <ProtectedEmail d="Y291cnNlcw==" />.
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
              <Link href="/for-tournaments" className="transition-colors hover:text-foreground">
                Tournaments
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
