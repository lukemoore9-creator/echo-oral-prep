import Link from "next/link";
import { Anchor, Mic, Shield, Check, Compass, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

const ticketCategories = [
  {
    label: "Commercial",
    tickets: [
      { name: "OOW Unlimited", icon: "⚓" },
      { name: "OOW Near Coastal", icon: "⚓" },
      { name: "Master <200GT", icon: "🚢" },
      { name: "Master <500GT", icon: "🛳️" },
      { name: "Master <3000GT", icon: "⛴️" },
      { name: "Master Unlimited", icon: "🚀" },
    ],
  },
  {
    label: "Yachting",
    tickets: [
      { name: "Yacht Master Offshore", icon: "⛵" },
      { name: "Yacht Master Ocean", icon: "🌊" },
      { name: "Mate <200GT Yacht", icon: "🛥️" },
      { name: "Master <200GT Yacht", icon: "🛥️" },
      { name: "Master <500GT Yacht", icon: "🛥️" },
      { name: "Master <3000GT Yacht", icon: "🛥️" },
    ],
  },
  {
    label: "Engineering",
    tickets: [
      { name: "Engineer OOW", icon: "⚙️" },
      { name: "ETO", icon: "⚡" },
    ],
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Try it out with limited sessions",
    features: [
      "3 practice sessions per month",
      "Basic feedback",
      "OOW Unlimited only",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "$19",
    period: "/mo",
    description: "For serious exam candidates",
    features: [
      "30 sessions per month",
      "All ticket types",
      "Detailed performance reports",
      "Session history",
    ],
    cta: "Start Basic",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$39",
    period: "/mo",
    description: "Unlimited practice, total confidence",
    features: [
      "Unlimited sessions",
      "All ticket types",
      "Advanced analytics & weak areas",
      "Priority voice quality",
      "Mock exam mode",
    ],
    cta: "Go Pro",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-gold/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Anchor className="h-6 w-6 text-gold" />
            <span className="font-heading text-xl font-bold tracking-tight">
              Helm AI
            </span>
          </Link>
          <div className="hidden items-center gap-8 sm:flex">
            <Link
              href="#tickets"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Exams
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
          </div>
          <Button
            render={<Link href="/select" />}
            size="sm"
            className="bg-gold text-navy font-semibold hover:bg-gold/90"
          >
            Start Practicing
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-chart-pattern">
        <div className="mx-auto max-w-4xl px-6 pb-24 pt-28 text-center lg:px-8 lg:pb-32 lg:pt-36">
          {/* Decorative compass */}
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-gold/20 bg-surface">
            <Compass className="h-8 w-8 text-gold" />
          </div>

          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Your AI Examiner.{" "}
            <span className="text-gold">Available 24/7.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Practice your MCA oral exam with an AI examiner that adapts to you.
            Voice-to-voice. Anytime.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              render={<Link href="/select" />}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-gold text-navy hover:bg-gold/90 shadow-lg shadow-gold/20"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Practicing
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gold/70" />
              MCA syllabus aligned
            </span>
            <span className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-gold/70" />
              Real voice conversation
            </span>
            <span className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-gold/70" />
              14 ticket types covered
            </span>
          </div>
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Ticket Types Grid ── */}
      <section id="tickets" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Every Ticket. Every Level.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              From OOW to Master Unlimited — choose your certificate and start
              practising with exam-relevant questions.
            </p>
          </div>

          <div className="mt-14 space-y-10">
            {ticketCategories.map((category) => (
              <div key={category.label}>
                <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-gold/80">
                  {category.label}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {category.tickets.map((ticket) => (
                    <div
                      key={ticket.name}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface/60 px-4 py-3 text-sm"
                    >
                      <span className="text-lg">{ticket.icon}</span>
                      <span className="font-medium text-foreground/90">
                        {ticket.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-gold/10 py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Simple Pricing
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Start free. Upgrade when you&#39;re ready to get serious about
              your exam.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? "border-gold/40 ring-1 ring-gold/20 shadow-lg shadow-gold/5"
                    : "border-white/5"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-0.5 text-xs font-bold text-navy">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardDescription className="text-muted-foreground">
                    {plan.description}
                  </CardDescription>
                  <CardTitle className="mt-1 flex items-baseline gap-1">
                    <span className="font-heading text-3xl font-extrabold">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5 text-sm">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-foreground/80"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="border-t-0 bg-transparent pt-0">
                  <Button
                    render={<Link href="/select" />}
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-gold text-navy font-semibold hover:bg-gold/90"
                        : "bg-surface text-foreground hover:bg-surface/80 border border-white/10"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gold/10 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Anchor className="h-5 w-5 text-gold/60" />
              <span className="font-heading text-sm font-semibold text-foreground/60">
                Helm AI
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="transition-colors hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="transition-colors hover:text-foreground">
                Terms
              </Link>
              <Link href="#" className="transition-colors hover:text-foreground">
                Contact
              </Link>
              <Link href="#" className="transition-colors hover:text-foreground">
                FAQ
              </Link>
            </div>
            <p className="text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} Helm AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
