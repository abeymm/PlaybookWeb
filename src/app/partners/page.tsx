"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  MapPinIcon,
  GaugeIcon,
  MonitorIcon,
  RocketIcon,
  StarIcon,
  ZapIcon,
  MailIcon,
  PhoneIcon,
  HandshakeIcon,
  CodeIcon,
  HeadphonesIcon,
  TrendingUpIcon,
} from "lucide-react";

const partnerTypes = [
  {
    icon: MapPinIcon,
    title: "Mapping & Pin Position Providers",
    description:
      "Course mapping services, daily pin position systems, and green slope data providers.",
    examples: "Pin sheets, green mapping, course surveys",
  },
  {
    icon: GaugeIcon,
    title: "Launch Monitors & Simulators",
    description:
      "Indoor and outdoor launch monitor manufacturers, simulator systems, and practice technology.",
    examples: "Trackman, Foresight, Full Swing, aboutGolf",
  },
  {
    icon: MonitorIcon,
    title: "Course & Tournament Software",
    description:
      "Tee time systems, tournament management platforms, and golf course operations software.",
    examples: "POS systems, booking platforms, scoring systems",
  },
];

const integrationTiers = [
  {
    name: "Pilot",
    badge: null,
    description: "Test the waters together",
    features: [
      "Technical collaboration",
      "Limited deployment (5-10 courses)",
      "Joint evaluation period",
      "No upfront commitment",
    ],
  },
  {
    name: "Standard",
    badge: "Popular",
    description: "Full integration partnership",
    features: [
      "Custom integration approach",
      "Unlimited course deployment",
      "Co-marketing opportunities",
      "Dedicated partner manager",
    ],
  },
  {
    name: "Premium",
    badge: null,
    description: "Strategic technology alliance",
    features: [
      "Deep product collaboration",
      "Revenue sharing models",
      "Joint product development",
      "Executive sponsorship",
    ],
  },
];

const whatPartnersGet = [
  { icon: CodeIcon, text: "Flexible integration tailored to your platform" },
  { icon: HeadphonesIcon, text: "Dedicated technical collaboration" },
  { icon: TrendingUpIcon, text: "Access to our growing course network" },
  { icon: StarIcon, text: "Co-marketing and promotional opportunities" },
];

const whatWeAsk = [
  { icon: HandshakeIcon, text: "Commitment to data quality standards" },
  { icon: ZapIcon, text: "Timely responses during integration" },
  { icon: RocketIcon, text: "Willingness to pilot with select courses" },
];

const faqs = [
  {
    question: "How do integrations work?",
    answer:
      "We're flexible and will work with whatever approach makes sense for your platform. Our backend is built on AWS, giving us the flexibility to connect with your systems in whatever way works best.",
  },
  {
    question: "Is there a cost to become a partner?",
    answer:
      "Pilot programs are free. Standard and Premium tiers may involve revenue sharing or licensing depending on the partnership scope.",
  },
  {
    question: "How long does integration typically take?",
    answer:
      "It depends on the complexity. Simple data integrations can be quick, while deeper collaborations take more time. We'll figure out the timeline together.",
  },
  {
    question: "Can we white-label Golf Playbook features?",
    answer:
      "Potentially—let's talk about what you have in mind. We're open to creative partnership structures.",
  },
  {
    question: "What kinds of data can we work with?",
    answer:
      "Pin positions, course mapping, player data, tee times—we're open to exploring what makes sense for both sides.",
  },
];

export default function PartnersPage() {
  const [formState, setFormState] = useState({
    companyName: "",
    contactName: "",
    email: "",
    partnerType: "",
    website: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "partner-inquiry",
          subject: `New Partner Inquiry: ${formState.companyName} (${formState.partnerType})`,
          email: formState.email,
          formData: formState,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
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
              <a href="#inquiry-form">Start a Conversation</a>
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
                Partner Program
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Integrate with Golf Playbook
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Connect your golf technology to our platform. Together we can deliver
                better experiences for courses and players.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <ShimmerButton
                  className="h-12 px-8"
                  background="#F5C518"
                  onClick={() => document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <span className="flex items-center gap-2 text-base font-semibold text-[#000000]">
                    Become a Partner
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </ShimmerButton>
                <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                  <a href="#partner-types">Explore Integrations</a>
                </Button>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Partner Types Section */}
      <section
        id="partner-types"
        className="border-y border-border/40 bg-muted/30 px-6 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Partner Types
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Who We Partner With
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                We&apos;re building an ecosystem of golf technology partners to enhance
                the player experience.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {partnerTypes.map((type) => (
                <Card key={type.title} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <type.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{type.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {type.description}
                    </p>
                    <p className="mt-4 text-xs text-muted-foreground/70">
                      Examples: {type.examples}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Integration Tiers Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Integration Tiers
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Choose Your Partnership Level
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Start small with a pilot or dive into a full strategic partnership.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {integrationTiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`relative overflow-hidden border-border/50 ${
                    tier.badge === "Popular" ? "border-primary/50 ring-1 ring-primary/20" : ""
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute right-4 top-4">
                      <Badge className="bg-primary text-primary-foreground">
                        {tier.badge}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckIcon className="h-4 w-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={tier.badge === "Popular" ? "default" : "outline"}
                      className="w-full"
                      asChild
                    >
                      <a href="#inquiry-form">Get Started</a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* What Partners Get / What We Ask Section */}
      <section className="border-y border-border/40 bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0.1}>
            <div className="grid gap-12 md:grid-cols-2">
              <div>
                <Badge variant="secondary" className="mb-4">
                  What You Get
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Partner Benefits
                </h2>
                <ul className="mt-6 space-y-4">
                  {whatPartnersGet.map((item) => (
                    <li key={item.text} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Badge variant="secondary" className="mb-4">
                  What We Ask
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Partner Expectations
                </h2>
                <ul className="mt-6 space-y-4">
                  {whatWeAsk.map((item) => (
                    <li key={item.text} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Pilot Program Callout */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <BlurFade delay={0.1}>
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <RocketIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mt-6 md:ml-8 md:mt-0">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                      Start with a Pilot Program
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                      Not sure if integration makes sense? Start with a no-commitment pilot.
                      We&apos;ll work together to test the integration with a handful of courses,
                      evaluate the results, and decide on next steps together.
                    </p>
                    <Button className="mt-6" asChild>
                      <a href="#inquiry-form">
                        Request a Pilot
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </a>
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

      {/* Inquiry Form Section */}
      <section id="inquiry-form" className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <BlurFade delay={0.1}>
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Get Started
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Start a Conversation
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Tell us about your company and how you&apos;d like to integrate.
                We&apos;ll be in touch within 48 hours.
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
                  <h3 className="mt-6 text-xl font-semibold">Thanks for reaching out!</h3>
                  <p className="mt-2 text-muted-foreground">
                    We&apos;ll review your inquiry and get back to you within 48 hours.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="mt-12">
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">
                          Company Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          required
                          value={formState.companyName}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, companyName: e.target.value }))
                          }
                          placeholder="Acme Golf Tech"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactName">
                          Contact Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contactName"
                          required
                          value={formState.contactName}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, contactName: e.target.value }))
                          }
                          placeholder="Your name"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
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
                          placeholder="you@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partnerType">
                          Partner Type <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formState.partnerType}
                          onValueChange={(value) =>
                            setFormState((prev) => ({ ...prev, partnerType: value }))
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mapping-pins">Mapping & Pin Positions</SelectItem>
                            <SelectItem value="launch-monitors">Launch Monitors & Simulators</SelectItem>
                            <SelectItem value="course-software">Course & Tournament Software</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website (optional)</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formState.website}
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, website: e.target.value }))
                        }
                        placeholder="https://yourcompany.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">
                        How would you like to integrate? (optional)
                      </Label>
                      <Textarea
                        id="description"
                        value={formState.description}
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Tell us about your product and the integration you have in mind..."
                        rows={4}
                      />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Inquiry"}
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
              <Link href="/for-courses" className="transition-colors hover:text-foreground">
                Courses
              </Link>
              <Link href="/for-tournaments" className="transition-colors hover:text-foreground">
                Tournaments
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
