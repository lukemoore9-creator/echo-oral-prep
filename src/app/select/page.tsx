"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Anchor } from "lucide-react";

const tickets = [
  {
    slug: "oow-unlimited",
    name: "OOW Unlimited",
    subtitle: "Officer of the Watch — Unlimited",
    category: "commercial",
    icon: "⚓",
  },
  {
    slug: "oow-nearcoastal",
    name: "OOW Near Coastal",
    subtitle: "Officer of the Watch — Near Coastal",
    category: "commercial",
    icon: "⚓",
  },
  {
    slug: "master-200gt",
    name: "Master <200GT",
    subtitle: "Near Coastal",
    category: "commercial",
    icon: "🚢",
  },
  {
    slug: "master-500gt",
    name: "Master <500GT",
    subtitle: "Offshore",
    category: "commercial",
    icon: "🛳️",
  },
  {
    slug: "master-3000gt",
    name: "Master <3000GT",
    subtitle: "Unlimited Area",
    category: "commercial",
    icon: "⛴️",
  },
  {
    slug: "master-unlimited",
    name: "Master Unlimited",
    subtitle: "Master Mariner",
    category: "commercial",
    icon: "🚀",
  },
  {
    slug: "ym-offshore",
    name: "Yacht Master Offshore",
    subtitle: "RYA/MCA Yacht Master",
    category: "yachting",
    icon: "⛵",
  },
  {
    slug: "ym-ocean",
    name: "Yacht Master Ocean",
    subtitle: "RYA/MCA Ocean",
    category: "yachting",
    icon: "🌊",
  },
  {
    slug: "mate-200gt-yacht",
    name: "Mate <200GT Yacht",
    subtitle: "MCA Yacht <200GT",
    category: "yachting",
    icon: "🛥️",
  },
  {
    slug: "master-200gt-yacht",
    name: "Master <200GT Yacht",
    subtitle: "MCA Yacht Master <200GT",
    category: "yachting",
    icon: "🛥️",
  },
  {
    slug: "master-500gt-yacht",
    name: "Master <500GT Yacht",
    subtitle: "MCA Yacht Master <500GT",
    category: "yachting",
    icon: "🛥️",
  },
  {
    slug: "master-3000gt-yacht",
    name: "Master <3000GT Yacht",
    subtitle: "MCA Yacht Master <3000GT",
    category: "yachting",
    icon: "🛥️",
  },
  {
    slug: "engineer-oow",
    name: "Engineer OOW",
    subtitle: "Y4 Marine Engineer",
    category: "engineering",
    icon: "⚙️",
  },
  {
    slug: "eto",
    name: "ETO",
    subtitle: "Electro-Technical Officer",
    category: "engineering",
    icon: "⚡",
  },
];

const categories = [
  { key: "commercial", label: "Commercial", icon: "⚓" },
  { key: "yachting", label: "Yachting", icon: "⛵" },
  { key: "engineering", label: "Engineering", icon: "⚙️" },
] as const;

export default function SelectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b border-gold/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-gold" />
            <span className="font-heading text-lg font-bold tracking-tight">
              Helm AI
            </span>
          </Link>
          <div className="w-14" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="mb-12 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Select Your Exam
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Choose the certificate of competency you&#39;re preparing for. Your
            AI examiner will tailor questions to that ticket.
          </p>
        </div>

        {/* ── Category Sections ── */}
        <div className="space-y-12">
          {categories.map((category) => {
            const categoryTickets = tickets.filter(
              (t) => t.category === category.key
            );

            return (
              <section key={category.key}>
                <h2 className="mb-5 flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-widest text-gold/80">
                  <span className="text-base">{category.icon}</span>
                  {category.label}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryTickets.map((ticket) => (
                    <button
                      key={ticket.slug}
                      onClick={() =>
                        router.push(`/session?ticket=${ticket.slug}`)
                      }
                      className="group relative flex items-start gap-4 rounded-xl border border-white/5 bg-surface/60 px-5 py-5 text-left transition-all duration-200 hover:scale-[1.02] hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.99]"
                    >
                      {/* Icon */}
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy text-2xl">
                        {ticket.icon}
                      </span>

                      {/* Text */}
                      <div className="min-w-0">
                        <p className="font-heading text-base font-semibold text-foreground group-hover:text-gold transition-colors">
                          {ticket.name}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {ticket.subtitle}
                        </p>
                      </div>

                      {/* Hover arrow */}
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/0 transition-all group-hover:text-gold/60 group-hover:translate-x-0.5">
                        &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
