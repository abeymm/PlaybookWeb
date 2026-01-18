import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BlurFade } from "@/components/ui/blur-fade";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Marquee } from "@/components/ui/marquee";
import { WordRotate } from "@/components/ui/word-rotate";
import { Particles } from "@/components/ui/particles";
import {
  MapIcon,
  PrinterIcon,
  Share2Icon,
  BrainIcon,
  TargetIcon,
  TrendingDownIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon,
  MenuIcon,
} from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/us/app/golf-playbook/id1557162395";

const features = [
  {
    Icon: MapIcon,
    name: "Course Strategy",
    description:
      "Map out every hole with detailed strategies for tee shots, approaches, and putting lines.",
    className: "col-span-1 md:col-span-2",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
    ),
    href: APP_STORE_URL,
    cta: "Get the App",
  },
  {
    Icon: BrainIcon,
    name: "AI Caddie",
    description:
      "Get intelligent club recommendations based on your skill level and conditions.",
    className: "col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
    ),
    href: APP_STORE_URL,
    cta: "Get the App",
  },
  {
    Icon: PrinterIcon,
    name: "Print Ready",
    description:
      "Export beautiful, professional playbooks to take on the course.",
    className: "col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
    ),
    href: APP_STORE_URL,
    cta: "Get the App",
  },
  {
    Icon: Share2Icon,
    name: "Share & Discover",
    description:
      "Share strategies with friends or discover playbooks from other golfers.",
    className: "col-span-1 md:col-span-2",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
    ),
    href: APP_STORE_URL,
    cta: "Get the App",
  },
];

const testimonials = [
  {
    name: "MLB freak",
    quote: "Great tool to plan your round. Particularly for competitive golf. Looking forward to using this through the tour season.",
  },
  {
    name: "Willow02",
    quote: "Phenomenal alternative to other paid apps or spending lots of time doing it yourself in Google Earth. Truly helpful for pre-round decision making.",
  },
  {
    name: "ECboy",
    quote: "Super cool and gives so much insight into each hole you're playing!",
  },
  {
    name: "Jeff$2",
    quote: "Being able to turn off compensations during tournaments is nice. Very eager to use this in practice rounds to think through my shots.",
  },
];

const benefits = [
  "Unlimited playbook creation",
  "AI-powered club recommendations",
  "Professional print exports",
  "Share with unlimited friends",
  "Access community playbooks",
  "Works offline on iOS",
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Particles Background */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={40}
        color="#FFBF00"
        ease={80}
        refresh
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo3d.png"
              alt="Golf Playbook"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-xl font-bold tracking-tight">Golf Playbook</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="#features">Features</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="#testimonials">Reviews</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="#pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/print">Print</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                <AnimatedShinyText className="text-sm font-medium">
                  Now available on iOS App Store
                </AnimatedShinyText>
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <h1 className="mt-8 text-center text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Play Every Hole With{" "}
              <span className="block">
                <WordRotate
                  words={["Strategy", "Confidence", "Purpose"]}
                  className="text-primary"
                />
              </span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.3}>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-muted-foreground md:text-xl">
              Create personalized course strategies, get AI-powered club recommendations,
              and print professional playbooks. Turn your practice into lower scores.
            </p>
          </BlurFade>

          <BlurFade delay={0.4}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <ShimmerButton className="h-12 px-8" background="#FFBF00">
                <span className="flex items-center gap-2 text-base font-semibold text-[#08401B]">
                  Download for iOS
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </ShimmerButton>
              <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                <Link href="#features">See How It Works</Link>
              </Button>
            </div>
          </BlurFade>

          <BlurFade delay={0.5}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground md:gap-8">
              <div className="flex items-center gap-2">
                <TargetIcon className="h-4 w-4 text-primary" />
                <span>Playbooks for 50+ courses</span>
              </div>
              <Separator orientation="vertical" className="hidden h-4 md:block" />
              <div className="flex items-center gap-2">
                <StarIcon className="h-4 w-4 fill-primary text-primary" />
                <span>5.0 App Store Rating</span>
              </div>
              <Separator orientation="vertical" className="hidden h-4 md:block" />
              <div className="flex items-center gap-2">
                <TrendingDownIcon className="h-4 w-4 text-primary" />
                <span>Play smarter, score better</span>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Everything you need to play smarter
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Golf Playbook combines course strategy, AI insights, and
                beautiful design to help you make better decisions on every hole.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <BentoGrid className="mt-12">
              {features.map((feature) => (
                <BentoCard key={feature.name} {...feature} />
              ))}
            </BentoGrid>
          </BlurFade>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="border-y border-border/40 bg-muted/30 px-6 py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Testimonials
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Golfers are shooting lower
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Join thousands of golfers who have improved their game with
                strategic course management.
              </p>
            </div>
          </BlurFade>

          <div className="relative mt-12">
            <Marquee pauseOnHover className="[--duration:40s]">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.name}
                  className="mx-2 w-80 shrink-0 border-border/50 bg-background"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className="h-4 w-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div className="mt-4">
                      <span className="font-medium">— {testimonial.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-muted/30 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-muted/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <BlurFade delay={0.1}>
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
              <CardContent className="p-8 md:p-12">
                <div className="grid gap-8 md:grid-cols-2 md:gap-12">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                      Ready to lower your scores?
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                      Download Golf Playbook today and start playing with a plan.
                      Free to try, with premium features for serious golfers.
                    </p>
                    <div className="mt-8">
                      <ShimmerButton className="h-12 px-8" background="#FFBF00">
                        <span className="flex items-center gap-2 text-base font-semibold text-[#08401B]">
                          Get Started Free
                          <ArrowRightIcon className="h-4 w-4" />
                        </span>
                      </ShimmerButton>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <ul className="space-y-4">
                      {benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
                            <CheckIcon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm">{benefit}</span>
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

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/logo3d.png"
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
