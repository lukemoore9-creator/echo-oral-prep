"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface BridgeSummary {
  topicsCovered: { slug: string; count: number }[];
  thingsToRevisit: string[];
  encouragement: string;
}

function SummaryInner() {
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<BridgeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const generateSummary = async () => {
      try {
        const stored = sessionStorage.getItem("echo-bridge-transcript");
        if (!stored) {
          setError(true);
          setLoading(false);
          return;
        }

        const transcript = JSON.parse(stored);
        if (!transcript.length) {
          setError(true);
          setLoading(false);
          return;
        }

        const res = await fetch("/api/bridge-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });

        if (!res.ok) throw new Error("Summary generation failed");
        const data = await res.json();
        setSummary(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper-warm">
        <Loader2 className="h-8 w-8 animate-spin text-chart-green" />
        <p className="mt-4 text-[15px] text-ink-muted">Wrapping up the conversation...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper-warm px-6">
        <p className="font-serif text-[22px] italic text-ink-soft" style={{ fontWeight: 400 }}>
          Good chat.
        </p>
        <Link
          href="/home"
          className="group relative mt-8 font-serif text-[17px] italic text-ink"
          style={{ fontWeight: 400 }}
        >
          Back to home &rarr;
          <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-paper-warm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-[720px] px-6 py-16">
        {/* Folio mark */}
        <p className="font-mono text-[10px] uppercase text-ink-muted" style={{ letterSpacing: "0.16em" }}>
          Folio 02 / Bridge Summary
        </p>

        <h1 className="mt-12 text-center font-serif text-[32px] text-ink" style={{ fontWeight: 400 }}>
          Topics covered today
        </h1>

        {/* Topic counts */}
        <div className="mt-8">
          {summary.topicsCovered.map((t) => (
            <p key={t.slug} className="py-1 font-mono text-[13px] text-ink-muted">
              {t.slug.toUpperCase()} &middot; {t.count} question{t.count !== 1 ? "s" : ""}
            </p>
          ))}
        </div>

        {/* Things to revisit */}
        {summary.thingsToRevisit.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-[22px] italic text-ink" style={{ fontWeight: 400 }}>
              Things to revisit
            </h2>
            <div className="mt-4 space-y-3">
              {summary.thingsToRevisit.map((item, i) => (
                <p key={i} className="font-serif text-[17px] text-ink-soft" style={{ fontWeight: 400 }}>
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Encouragement */}
        {summary.encouragement && (
          <p className="mt-8 font-serif text-[17px] italic text-ink-soft" style={{ fontWeight: 400 }}>
            {summary.encouragement}
          </p>
        )}

        {/* CTA */}
        <div className="mt-12">
          <Link
            href="/home"
            className="group relative font-serif text-[22px] italic text-ink"
            style={{ fontWeight: 400 }}
          >
            Back to home &rarr;
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function BridgeSummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-paper-warm">
          <Loader2 className="h-8 w-8 animate-spin text-chart-green" />
        </div>
      }
    >
      <SummaryInner />
    </Suspense>
  );
}
