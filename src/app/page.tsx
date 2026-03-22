import Link from "next/link";
import {
  Anchor,
  Compass,
  Ship,
  Sailboat,
  Check,
} from "lucide-react";

const courses = [
  {
    name: "Master Unlimited",
    subtitle: "Master Mariner — Unlimited",
    slug: "master-unlimited",
    Icon: Anchor,
  },
  {
    name: "OOW Unlimited",
    subtitle: "Officer of the Watch — Unlimited",
    slug: "oow-unlimited",
    Icon: Compass,
  },
  {
    name: "Yacht Master Ocean",
    subtitle: "RYA/MCA Yacht Master — Ocean",
    slug: "ym-ocean",
    Icon: Ship,
  },
  {
    name: "Yacht Master Offshore",
    subtitle: "RYA/MCA Yacht Master — Offshore",
    slug: "ym-offshore",
    Icon: Sailboat,
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    features: ["2 sessions/month", "10 min each"],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "$19/mo",
    features: ["Unlimited sessions", "All ticket types", "Session history"],
    cta: "Subscribe",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$39/mo",
    features: [
      "Everything in Basic",
      "Analytics",
      "Weak-spot targeting",
      "Exam readiness score",
    ],
    cta: "Subscribe",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* ── Sticky Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-[#FFFFFF]">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="font-bold text-xl text-[#111111]">
            Helm AI
          </Link>
          <Link
            href="/select"
            className="inline-flex items-center justify-center bg-[#2563EB] text-white rounded-lg px-6 py-3 text-[15px] font-medium hover:bg-[#1D4ED8] transition-colors"
          >
            Start Practicing
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <h1 className="text-5xl font-bold text-[#111111] leading-tight tracking-tight">
            Prepare for your oral exam with AI
          </h1>
          <p className="text-lg text-[#6B7280] mt-6 max-w-xl">
            One-to-one exam prep with an AI examiner that adapts to your level.
            Voice-to-voice. Available 24/7.
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              href="/select"
              className="inline-flex items-center justify-center bg-[#2563EB] text-white rounded-lg px-6 py-3 text-[15px] font-medium hover:bg-[#1D4ED8] transition-colors"
            >
              Start practicing
            </Link>
            <a
              href="#courses"
              className="inline-flex items-center justify-center bg-white border border-[#E5E7EB] text-[#111111] rounded-lg px-6 py-3 text-[15px] font-medium hover:border-[#D1D5DB] transition-colors"
            >
              View courses
            </a>
          </div>
        </div>
      </section>

      {/* ── Courses ── */}
      <section id="courses" className="bg-[#F7F8FA]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="text-3xl font-bold text-[#111111]">
            Select your exam
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <Link
                key={course.slug}
                href={`/session?ticket=${course.slug}`}
                className="group bg-white border border-[#E5E7EB] rounded-xl p-6 transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F7F8FA]">
                  <course.Icon className="h-6 w-6 text-[#6B7280]" />
                </div>
                <h3 className="mt-4 font-bold text-[#111111]">
                  {course.name}
                </h3>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {course.subtitle}
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-[#2563EB] group-hover:underline">
                  Start exam prep &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="text-3xl font-bold text-[#111111]">Pricing</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-xl p-6 flex flex-col ${
                  plan.highlighted
                    ? "border-2 border-[#2563EB]"
                    : "border border-[#E5E7EB]"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-xs px-3 py-1 rounded-full font-medium">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-[#111111]">
                  {plan.name}
                </h3>
                <p className="mt-2 text-3xl font-bold text-[#111111]">
                  {plan.price}
                </p>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-[#6B7280]"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[#2563EB]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-8 w-full rounded-lg px-6 py-3 text-[15px] font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                      : "bg-white border border-[#E5E7EB] text-[#111111] hover:border-[#D1D5DB]"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promo Banner ── */}
      <section className="bg-[#F7F8FA]">
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <p className="text-center text-[#6B7280] text-[15px]">
            Download 4 free courses — Master Unlimited, OOW Unlimited, Yacht
            Master Offshore, Yacht Master Ocean. Head to{" "}
            <a
              href="https://helmaiprep.com"
              className="text-[#2563EB] font-medium hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              helmaiprep.com
            </a>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E5E7EB]">
        <div className="mx-auto max-w-[1200px] px-6 py-8 flex items-center justify-between">
          <span className="font-bold text-[#111111]">Helm AI</span>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-sm text-[#6B7280] hover:text-[#111111] transition-colors"
            >
              About
            </Link>
            <Link
              href="#"
              className="text-sm text-[#6B7280] hover:text-[#111111] transition-colors"
            >
              Contact
            </Link>
            <Link
              href="#"
              className="text-sm text-[#6B7280] hover:text-[#111111] transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
