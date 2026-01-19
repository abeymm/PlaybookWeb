"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BlurFade } from "@/components/ui/blur-fade";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  FileTextIcon,
  TruckIcon,
  MessageSquareIcon,
  MegaphoneIcon,
  BookOpenIcon,
  MapPinIcon,
  WindIcon,
  TableIcon,
  ImageIcon,
  UsersIcon,
  DollarSignIcon,
  HeartHandshakeIcon,
  MailIcon,
  PhoneIcon,
} from "lucide-react";

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
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    tournamentName: "",
    courseName: "",
    eventDate: "",
    playerCount: "",
    interests: [] as string[],
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      interests: checked
        ? [...prev.interests, interest]
        : prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tournament-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  Professional Yardage Books for Your Event
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Give every player a printed strategy playbook—sponsored by your partners
                  or included in registration.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <ShimmerButton className="h-12 px-8" background="#FFBF00">
                    <a
                      href="#quote"
                      className="flex items-center gap-2 text-base font-semibold text-[#08401B]"
                    >
                      Request a Quote
                      <ArrowRightIcon className="h-4 w-4" />
                    </a>
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
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                How It Works
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Three simple steps
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                From your event details to professional playbooks in players&apos; hands.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card className="relative overflow-hidden border-border/50">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquareIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Step 1
                    </span>
                    <h3 className="mt-1 text-xl font-semibold">Share Your Event Details</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Tell us your course, date, and player count. We&apos;ll create a custom
                      playbook tailored to your tournament.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-border/50">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MegaphoneIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Step 2
                    </span>
                    <h3 className="mt-1 text-xl font-semibold">Add Sponsor Ads (Optional)</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Offset costs or generate revenue with premium ad placements in every
                      book.
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
                    <span className="text-sm font-medium text-muted-foreground">
                      Step 3
                    </span>
                    <h3 className="mt-1 text-xl font-semibold">We Print & Ship</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Professional pocket-sized booklets delivered to your event, ready
                      to hand out.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
              <ShimmerButton className="h-12 px-8" background="#FFBF00">
                <a
                  href="#quote"
                  className="flex items-center gap-2 text-base font-semibold text-[#08401B]"
                >
                  Request a Quote
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
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

      {/* Lead Capture Form Section */}
      <section id="quote" className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Get Started
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Request a Quote
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Tell us about your tournament and we&apos;ll get back to you within 24 hours
                with a custom quote.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            {isSubmitted ? (
              <Card className="mt-12 border-primary/20 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    <CheckIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">Thanks for your request!</h3>
                  <p className="mt-2 text-muted-foreground">
                    We&apos;ll be in touch within 24 hours with your custom quote.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="mt-12">
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          required
                          value={formState.name}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formState.email}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formState.phone}
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="tournamentName">
                          Tournament Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="tournamentName"
                          required
                          value={formState.tournamentName}
                          onChange={(e) =>
                            setFormState((prev) => ({
                              ...prev,
                              tournamentName: e.target.value,
                            }))
                          }
                          placeholder="Annual Charity Golf Classic"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="courseName">
                          Course Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="courseName"
                          required
                          value={formState.courseName}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, courseName: e.target.value }))
                          }
                          placeholder="Pebble Beach Golf Links"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="eventDate">Event Date (optional)</Label>
                        <Input
                          id="eventDate"
                          type="date"
                          value={formState.eventDate}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, eventDate: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="playerCount">Estimated Players</Label>
                        <Select
                          value={formState.playerCount}
                          onValueChange={(value) =>
                            setFormState((prev) => ({ ...prev, playerCount: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50-100">50-100 players</SelectItem>
                            <SelectItem value="100-200">100-200 players</SelectItem>
                            <SelectItem value="200+">200+ players</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Interested In</Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="player-funded"
                            checked={formState.interests.includes("player-funded")}
                            onCheckedChange={(checked) =>
                              handleInterestChange("player-funded", checked === true)
                            }
                          />
                          <Label htmlFor="player-funded" className="font-normal">
                            Player-funded playbooks
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="sponsor-funded"
                            checked={formState.interests.includes("sponsor-funded")}
                            onCheckedChange={(checked) =>
                              handleInterestChange("sponsor-funded", checked === true)
                            }
                          />
                          <Label htmlFor="sponsor-funded" className="font-normal">
                            Sponsor-funded playbooks
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="both"
                            checked={formState.interests.includes("both")}
                            onCheckedChange={(checked) =>
                              handleInterestChange("both", checked === true)
                            }
                          />
                          <Label htmlFor="both" className="font-normal">
                            Both options
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={formState.notes}
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        placeholder="Any special requirements, questions, or details about your event..."
                        rows={4}
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </BlurFade>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border/40 bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-muted-foreground">
            Have questions? Reach out to us directly.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            <a
              href="mailto:support@playbook.golf"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <MailIcon className="h-4 w-4" />
              support@playbook.golf
            </a>
            <a
              href="tel:832-533-7573"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <PhoneIcon className="h-4 w-4" />
              832-533-7573
            </a>
          </div>
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
