import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight text-ink">
          Prepare for your oral exam with AI
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-muted">
          One-to-one exam prep with an AI examiner that adapts to your level.
          Voice-to-voice. Available 24/7.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/select"
            className="inline-flex items-center justify-center rounded-lg bg-chart-green px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-ink"
          >
            Start drilling
          </Link>
          <a
            href="#courses"
            className="inline-flex items-center justify-center rounded-lg border border-rule bg-paper px-6 py-3 text-[15px] font-medium text-ink transition-colors hover:border-rule-strong"
          >
            View tickets
          </a>
        </div>
      </div>
    </section>
  );
}
