"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Anchor, Sailboat, Wrench } from "lucide-react";

const tickets = [
  {
    slug: "oow-unlimited",
    name: "OOW Unlimited",
    subtitle: "Officer of the Watch — Unlimited",
    category: "commercial",
  },
  {
    slug: "oow-nearcoastal",
    name: "OOW Near Coastal",
    subtitle: "Officer of the Watch — Near Coastal",
    category: "commercial",
  },
  {
    slug: "master-200gt",
    name: "Master <200GT",
    subtitle: "Master — Near Coastal",
    category: "commercial",
  },
  {
    slug: "master-500gt",
    name: "Master <500GT",
    subtitle: "Master — Offshore",
    category: "commercial",
  },
  {
    slug: "master-3000gt",
    name: "Master <3000GT",
    subtitle: "Master — Unlimited Area",
    category: "commercial",
  },
  {
    slug: "master-unlimited",
    name: "Master Unlimited",
    subtitle: "Master Mariner — Unlimited",
    category: "commercial",
  },
  {
    slug: "ym-offshore",
    name: "Yacht Master Offshore",
    subtitle: "RYA/MCA Yacht Master",
    category: "yachting",
  },
  {
    slug: "ym-ocean",
    name: "Yacht Master Ocean",
    subtitle: "RYA/MCA Ocean",
    category: "yachting",
  },
  {
    slug: "mate-200gt-yacht",
    name: "Mate <200GT Yacht",
    subtitle: "MCA Yacht <200GT",
    category: "yachting",
  },
  {
    slug: "master-200gt-yacht",
    name: "Master <200GT Yacht",
    subtitle: "MCA Yacht Master <200GT",
    category: "yachting",
  },
  {
    slug: "master-500gt-yacht",
    name: "Master <500GT Yacht",
    subtitle: "MCA Yacht Master <500GT",
    category: "yachting",
  },
  {
    slug: "master-3000gt-yacht",
    name: "Master <3000GT Yacht",
    subtitle: "MCA Yacht Master <3000GT",
    category: "yachting",
  },
  {
    slug: "engineer-oow",
    name: "Engineer OOW",
    subtitle: "Y4 Marine Engineer",
    category: "engineering",
  },
  {
    slug: "eto",
    name: "ETO",
    subtitle: "Electro-Technical Officer",
    category: "engineering",
  },
];

const categories = [
  {
    key: "commercial",
    label: "Commercial",
    Icon: Anchor,
  },
  {
    key: "yachting",
    label: "Yachting",
    Icon: Sailboat,
  },
  {
    key: "engineering",
    label: "Engineering",
    Icon: Wrench,
  },
] as const;

function getCategoryIcon(category: string) {
  switch (category) {
    case "commercial":
      return Anchor;
    case "yachting":
      return Sailboat;
    case "engineering":
      return Wrench;
    default:
      return Anchor;
  }
}

export default function SelectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* ── Header ── */}
      <header className="border-b border-[#E5E7EB] bg-[#FFFFFF]">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link href="/" className="font-bold text-lg text-[#111111]">
            Helm AI
          </Link>
          <div className="w-14" />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-[#111111]">
            Select Your Exam
          </h1>
          <p className="mt-3 text-[#6B7280]">
            Choose the certificate you're preparing for.
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
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  <category.Icon className="h-4 w-4" />
                  {category.label}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTickets.map((ticket) => {
                    const TicketIcon = getCategoryIcon(ticket.category);

                    return (
                      <button
                        key={ticket.slug}
                        onClick={() =>
                          router.push(`/session?ticket=${ticket.slug}`)
                        }
                        className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-xl px-5 py-4 text-left transition-all hover:border-[#D1D5DB] hover:shadow-sm cursor-pointer"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F7F8FA]">
                          <TicketIcon className="h-5 w-5 text-[#6B7280]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#111111]">
                            {ticket.name}
                          </p>
                          <p className="mt-0.5 text-sm text-[#6B7280]">
                            {ticket.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
