import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BlurFade } from "@/components/ui/blur-fade";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  PackageIcon,
  TruckIcon,
  SmartphoneIcon,
  SparklesIcon,
  ShieldCheckIcon,
  DropletIcon,
  LeafIcon,
  BookOpenIcon,
} from "lucide-react";

const pricingTiers = [
  {
    quantity: "1-9",
    label: "Standard",
    price: "$24.99",
    perUnit: "$24.99 each",
    savings: null,
    popular: false,
  },
  {
    quantity: "10-49",
    label: "Group",
    price: "$19.99",
    perUnit: "$19.99 each",
    savings: "20% off",
    popular: true,
  },
  {
    quantity: "50-99",
    label: "Event",
    price: "$16.99",
    perUnit: "$16.99 each",
    savings: "32% off",
    popular: false,
  },
  {
    quantity: "100+",
    label: "Tournament",
    price: "$14.99",
    perUnit: "$14.99 each",
    savings: "40% off",
    popular: false,
  },
];

const covers = [
  {
    Icon: SparklesIcon,
    name: "Leather Cover",
    description:
      "Premium full-grain leather with a soft interior lining. Available in Black, Brown, and Tan. Fits all Golf Playbook prints.",
    price: "$34.99",
    className: "col-span-3 md:col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-amber-800/20 to-transparent" />
    ),
    href: "#",
    cta: "View Details",
  },
  {
    Icon: DropletIcon,
    name: "Waterproof Cover",
    description:
      "All-weather nylon construction with a clear front window and convenient belt clip. Perfect for any conditions.",
    price: "$19.99",
    className: "col-span-3 md:col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent" />
    ),
    href: "#",
    cta: "View Details",
  },
  {
    Icon: LeafIcon,
    name: "Canvas Cover",
    description:
      "Waxed canvas with a vintage look and brass hardware. Classic style meets modern protection.",
    price: "$24.99",
    className: "col-span-3 md:col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent" />
    ),
    href: "#",
    cta: "View Details",
  },
];

const bundles = [
  {
    name: "Starter Bundle",
    contents: "1 Playbook + Waterproof Cover",
    price: "$39.99",
    savings: "Save $5",
    badge: null,
  },
  {
    name: "Premium Bundle",
    contents: "2 Playbooks + Leather Cover",
    price: "$74.99",
    savings: "Save $15",
    badge: "Popular",
  },
  {
    name: "Team Bundle",
    contents: "10 Playbooks + 10 Waterproof Covers",
    price: "$299.99",
    savings: "Save $60",
    badge: "Best Value",
  },
];

const qualityPoints = [
  "Premium 100lb cardstock",
  "Weather-resistant lamination",
  "Spiral binding that lays flat",
  "Color-accurate printing",
  "Satisfaction guaranteed",
];

const faqs = [
  {
    question: "How long does printing take?",
    answer:
      "Standard orders are delivered in 5-7 business days. Rush delivery (3 days) is available for an additional fee.",
  },
  {
    question: "What size are the playbooks?",
    answer:
      "Pocket-sized for easy use on the course, and fully compliant with USGA rules for green-reading materials.",
  },
  {
    question: "Can I order for my golf group?",
    answer:
      "Yes! We offer volume discounts starting at 10 playbooks. Orders of 100+ get our best pricing at $14.99 each.",
  },
  {
    question: "What if I update my playbook?",
    answer:
      "Simply order a new print with your updated strategy. Your previous printed playbooks will still be usable.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Currently, we only ship within the United States. International shipping is coming soon.",
  },
];

export default function PrintPage() {
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
              <Link href="#pricing">View Pricing</Link>
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
                  Print Service
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Print Your Perfect Round
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Professional-quality playbooks delivered to your door. From course
                  strategy to your hands in days.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <ShimmerButton className="h-12 px-8" background="#FFBF00">
                    <span className="flex items-center gap-2 text-base font-semibold text-[#08401B]">
                      Order in App
                      <ArrowRightIcon className="h-4 w-4" />
                    </span>
                  </ShimmerButton>
                  <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                    <Link href="#pricing">See Pricing</Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <BookOpenIcon className="mx-auto h-16 w-16 text-muted-foreground/50" />
                      <p className="mt-4 text-sm text-muted-foreground">Playbook Preview</p>
                    </div>
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
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                How It Works
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Three simple steps
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Getting your professional playbook is easy. Create, customize, and receive.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card className="relative overflow-hidden border-border/50">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <SmartphoneIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-muted-foreground">Step 1</span>
                    <h3 className="mt-1 text-xl font-semibold">Create</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Design your playbook in the app with hole-by-hole strategy, notes, and
                      distances.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-border/50">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <PackageIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-muted-foreground">Step 2</span>
                    <h3 className="mt-1 text-xl font-semibold">Customize</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Choose your quantity, cover style, and any add-ons. Tap &quot;Print&quot;
                      in the app.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-border/50">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <TruckIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-muted-foreground">Step 3</span>
                    <h3 className="mt-1 text-xl font-semibold">Receive</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your playbooks arrive ready to use on the course. Professional quality,
                      delivered fast.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Pricing
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Volume discounts for every golfer
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Order more, save more. Perfect for golf groups, teams, and clubs.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.quantity}
                  className={`relative overflow-hidden border-border/50 ${
                    tier.popular ? "border-primary/50 ring-1 ring-primary/20" : ""
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute right-4 top-4">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{tier.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">{tier.quantity} playbooks</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">{tier.price}</span>
                      <span className="text-sm text-muted-foreground">/ each</span>
                    </div>
                    {tier.savings && (
                      <Badge variant="secondary" className="mt-3">
                        {tier.savings}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </BlurFade>

          <BlurFade delay={0.3}>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Professional quality • Pocket-sized • Tournament ready
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Premium edition coming soon
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Covers Section */}
      <section id="covers" className="border-y border-border/40 bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Accessories
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Premium yardage book covers
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Protect your playbook in style with our handcrafted covers.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <BentoGrid className="mt-12 auto-rows-[18rem]">
              {covers.map((cover) => (
                <div
                  key={cover.name}
                  className={`group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:bg-background dark:[border:1px_solid_rgba(255,255,255,.1)] ${cover.className}`}
                >
                  <div>{cover.background}</div>
                  <div className="p-6">
                    <cover.Icon className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">{cover.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{cover.description}</p>
                    <p className="mt-4 text-2xl font-bold text-primary">{cover.price}</p>
                  </div>
                </div>
              ))}
            </BentoGrid>
          </BlurFade>
        </div>
      </section>

      {/* Bundle Deals Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Bundles
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Save more with bundles
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Get playbooks and covers together at a discount.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {bundles.map((bundle) => (
                <Card
                  key={bundle.name}
                  className="relative overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-background to-background"
                >
                  {bundle.badge && (
                    <div className="absolute right-4 top-4">
                      <Badge
                        className={
                          bundle.badge === "Best Value"
                            ? "bg-emerald-600 text-white"
                            : "bg-primary text-primary-foreground"
                        }
                      >
                        {bundle.badge}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{bundle.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{bundle.contents}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{bundle.price}</span>
                    </div>
                    <Badge variant="outline" className="mt-3 border-primary/30 text-primary">
                      {bundle.savings}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Quality Section */}
      <section className="border-y border-border/40 bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <BlurFade delay={0.1}>
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-8 md:p-12">
                <div className="grid gap-8 md:grid-cols-2 md:gap-12">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheckIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
                      Quality you can trust
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                      Every playbook is printed with premium materials designed to withstand
                      the elements and last for seasons of play.
                    </p>
                  </div>
                  <div className="flex flex-col justify-center">
                    <ul className="space-y-4">
                      {qualityPoints.map((point) => (
                        <li key={point} className="flex items-center gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
                            <CheckIcon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                FAQ
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Frequently asked questions
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

      {/* Final CTA Section */}
      <section className="border-t border-border/40 bg-gradient-to-b from-muted/50 to-background px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <BlurFade delay={0.1}>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to print?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Download Golf Playbook, create your strategy, and order your professional
              printed playbook today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <ShimmerButton className="h-12 px-8" background="#FFBF00">
                <span className="flex items-center gap-2 text-base font-semibold text-[#08401B]">
                  Download for iOS
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </ShimmerButton>
              <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                <Link href="/#features">Learn More</Link>
              </Button>
            </div>
          </BlurFade>
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
