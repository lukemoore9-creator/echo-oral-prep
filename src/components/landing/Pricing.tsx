import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Free",
    price: "0",
    description: "Get started with basic practice sessions",
    features: [
      "2 practice sessions per month",
      "10 minutes per session",
      "3 ticket types",
      "Basic scoring",
    ],
    cta: "Start Free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "19",
    description: "Unlimited practice for serious candidates",
    features: [
      "Unlimited sessions",
      "All 14 ticket types",
      "Unlimited session length",
      "Detailed scoring & feedback",
      "Session history & progress",
      "Topic-specific drills",
    ],
    cta: "Get Basic",
    href: "/signup?plan=basic",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "39",
    description: "Maximum preparation with advanced analytics",
    features: [
      "Everything in Basic",
      "Exam Readiness Score",
      "Weak-spot targeting",
      "Examiner style profiles",
      "Priority voice processing",
      "Export session transcripts",
      "Study mode (non-exam learning)",
    ],
    cta: "Get Pro",
    href: "/signup?plan=pro",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing.{" "}
            <span className="text-gold">Pass your exam.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your preparation timeline.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 ${
                tier.highlighted
                  ? "border-2 border-gold bg-card shadow-xl shadow-gold/10"
                  : "border border-gold/10 bg-card"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-sm font-semibold text-navy">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="font-heading text-xl font-semibold">{tier.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tier.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold text-gold">
                    ${tier.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-gold" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                render={<Link href={tier.href} />}
                className={`mt-8 w-full ${
                  tier.highlighted
                    ? "bg-gold text-navy hover:bg-gold/90"
                    : "bg-surface text-foreground hover:bg-surface/80 border border-gold/20"
                }`}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
