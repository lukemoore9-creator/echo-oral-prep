'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTicketName } from '@/lib/tickets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SectionQuestion {
  q: string;
  performance: 'strong' | 'ok' | 'weak';
}

interface SectionBreakdown {
  section: string;
  score: number;
  questions: SectionQuestion[];
}

interface KeyMoment {
  question: string;
  studentResponse: string;
  verdict: string;
  verdictTone: 'good' | 'ok' | 'bad';
  modelAnswer: string;
}

interface DrillCard {
  topicSlug: string;
  topicName: string;
  reason: string;
}

interface Report {
  overallScore: number;
  verdict: 'pass' | 'marginal' | 'refer';
  examinerJudgement: string;
  confidence: 'high' | 'medium' | 'low';
  sectionBreakdown: SectionBreakdown[];
  keyMoments: KeyMoment[];
  topThreeDrills: DrillCard[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VERDICT_COLOURS: Record<string, string> = {
  pass: '#1F4E3D',
  marginal: '#9A7B3A',
  refer: '#8B2E2E',
};

const PERFORMANCE_COLOURS: Record<string, string> = {
  strong: '#1F4E3D',
  ok: '#9A7B3A',
  weak: '#8B2E2E',
  good: '#1F4E3D',
  bad: '#8B2E2E',
};

function barFillColour(score: number): string {
  if (score >= 75) return '#1F4E3D';
  if (score >= 50) return '#9A7B3A';
  return '#D8D4C7';
}

function computeVerdict(score: number): 'pass' | 'marginal' | 'refer' {
  if (score >= 75) return 'pass';
  if (score >= 60) return 'marginal';
  return 'refer';
}

// ---------------------------------------------------------------------------
// Inner component (needs Suspense for useSearchParams)
// ---------------------------------------------------------------------------

function ReportInner() {
  const searchParams = useSearchParams();
  const ticketSlug = searchParams.get('ticket') || 'oow-unlimited';
  const ticketName = getTicketName(ticketSlug);

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Verdict reveal beats
  const [revealBeat, setRevealBeat] = useState(0); // 0=black, 1=verdict, 2=judgement, 3=full

  useEffect(() => {
    const generateReport = async () => {
      try {
        const stored = sessionStorage.getItem('echo-transcript');
        if (!stored) {
          setError('no-transcript');
          setLoading(false);
          return;
        }

        const transcript = JSON.parse(stored);

        if (!transcript.length) {
          setError('no-transcript');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, ticketType: ticketName }),
        });

        if (!res.ok) {
          throw new Error(`Report generation failed (${res.status})`);
        }

        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error('Report error:', err);
        setError('Failed to generate report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    generateReport();
  }, [ticketName]);

  // Reveal sequence: after report loads, advance beats
  useEffect(() => {
    if (!report) return;
    // Beat 0 (black) held for 2.5s
    const t1 = setTimeout(() => setRevealBeat(1), 2500);
    // Beat 1 (verdict word) → Beat 2 (judgement) at 4s
    const t2 = setTimeout(() => setRevealBeat(2), 4000);
    // Beat 2 → Beat 3 (full report) at 5.5s
    const t3 = setTimeout(() => setRevealBeat(3), 5500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [report]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6">
        <p className="font-serif text-[22px] italic text-paper" style={{ fontWeight: 400 }}>
          Marking the paper.
        </p>
        <p
          className="mt-3 font-mono text-[11px] uppercase text-rule"
          style={{ letterSpacing: '0.16em' }}
        >
          One Moment
        </p>
      </div>
    );
  }

  // ── Empty state — no transcript ──
  if (error === 'no-transcript') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
        <AlertTriangle className="h-8 w-8 text-ink-muted" />
        <p className="mt-4 max-w-md text-center font-serif text-[15px] italic text-ink-muted" style={{ fontWeight: 400 }}>
          This report needs a completed examination session. Head back and take one first.
        </p>
        <Link
          href="/examination"
          className="group relative mt-8 font-serif text-[17px] italic text-ink"
          style={{ fontWeight: 400 }}
        >
          Take the chair &rarr;
          <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
        </Link>
      </div>
    );
  }

  // ── Error state ──
  if (error || !report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
        <AlertTriangle className="h-8 w-8 text-marginal" />
        <p className="mt-4 font-serif text-[15px] italic text-ink" style={{ fontWeight: 400 }}>
          {error || 'Something went wrong'}
        </p>
        <Link
          href="/examination"
          className="group relative mt-8 font-serif text-[17px] italic text-ink"
          style={{ fontWeight: 400 }}
        >
          Try again &rarr;
          <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
        </Link>
      </div>
    );
  }

  // ── Derive verdict client-side ──
  const verdict = computeVerdict(report.overallScore);
  const verdictColour = VERDICT_COLOURS[verdict];

  // ── Verdict reveal sequence (UNTOUCHED) ──
  if (revealBeat < 3) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink">
        {/* Beat 1: Verdict word */}
        <AnimatePresence>
          {revealBeat >= 1 && (
            <motion.span
              className="font-serif text-[96px] font-bold uppercase leading-none"
              style={{ color: verdictColour }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {verdict}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Beat 2: Examiner judgement */}
        <AnimatePresence>
          {revealBeat >= 2 && (
            <motion.p
              className="mt-6 max-w-lg text-center font-serif text-[22px] italic leading-relaxed text-paper/80"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {report.examinerJudgement}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Full report view ──
  return (
    <motion.div
      className="min-h-screen bg-paper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <main className="mx-auto max-w-[880px] px-6 py-12">
        {/* ── Zone 1: Verdict Banner ── */}
        <div className="border-t border-rule" />
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span
            className="font-serif text-[40px] sm:text-[56px] uppercase leading-none"
            style={{ color: verdictColour, fontWeight: 400 }}
          >
            {verdict}
          </span>
          <p className="flex-1 font-serif text-[17px] italic text-ink sm:text-center" style={{ fontWeight: 400 }}>
            {report.examinerJudgement}
          </p>
          <div className="shrink-0 sm:text-right">
            <span className="font-mono text-[32px] leading-none text-ink" style={{ fontWeight: 500 }}>
              {report.overallScore}{' '}
              <span className="text-[18px] text-ink-muted" style={{ fontWeight: 400 }}>/ 100</span>
            </span>
            <p
              className="mt-1 font-mono text-[11px] uppercase text-ink-muted"
              style={{ letterSpacing: '0.12em' }}
            >
              Confidence &middot; {report.confidence}
            </p>
          </div>
        </div>
        <div className="border-t border-rule" />

        {/* ── Zone 2: Section Breakdown ── */}
        {report.sectionBreakdown.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-[24px] text-ink" style={{ fontWeight: 400 }}>
              Section breakdown
            </h2>
            <div className="mt-6">
              {report.sectionBreakdown.map((section) => {
                const isExpanded = expandedSection === section.section;
                return (
                  <div key={section.section} className="border-b border-rule">
                    <button
                      onClick={() =>
                        setExpandedSection(isExpanded ? null : section.section)
                      }
                      className="flex w-full items-center gap-4 py-4"
                    >
                      <span className="w-48 shrink-0 text-left font-serif text-[17px] italic text-ink" style={{ fontWeight: 400 }}>
                        {section.section}
                      </span>
                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-rule">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(section.score, 2)}%`,
                              backgroundColor: barFillColour(section.score),
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-10 shrink-0 text-right font-mono text-[13px] text-ink-muted">
                        {section.score}%
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-ink-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" />
                      )}
                    </button>
                    {isExpanded && section.questions.length > 0 && (
                      <div className="mb-4 ml-3 border-l border-rule pl-6 pt-1 pb-2">
                        {section.questions.map((q, qi) => (
                          <div
                            key={qi}
                            className="flex items-start gap-3 py-1.5"
                          >
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  PERFORMANCE_COLOURS[q.performance] || '#9A7B3A',
                              }}
                            />
                            <span className="font-serif text-[15px] italic text-ink-soft" style={{ fontWeight: 400 }}>
                              {q.q}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Zone 3: Key Moments ── */}
        {report.keyMoments.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-[24px] text-ink" style={{ fontWeight: 400 }}>
              Key moments
            </h2>
            <div className="mt-8">
              {report.keyMoments.map((moment, i) => (
                <div key={i}>
                  {/* Moment block */}
                  <div>
                    <p className="font-serif text-[19px] italic text-ink" style={{ fontWeight: 400 }}>
                      {moment.question}
                    </p>
                    <p className="mt-3 font-serif text-[15px] italic text-ink-muted" style={{ fontWeight: 400 }}>
                      &mdash; &ldquo;{moment.studentResponse}&rdquo;
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            PERFORMANCE_COLOURS[moment.verdictTone] || '#9A7B3A',
                        }}
                      />
                      <span className="font-serif text-[15px] italic text-ink" style={{ fontWeight: 400 }}>
                        {moment.verdict}
                      </span>
                    </div>
                    {moment.modelAnswer && (
                      <div className="mt-4">
                        <p
                          className="font-mono text-[10px] uppercase text-ink-muted"
                          style={{ letterSpacing: '0.12em' }}
                        >
                          What good looked like
                        </p>
                        <p className="mt-1.5 font-serif text-[15px] italic text-ink-soft" style={{ fontWeight: 400 }}>
                          {moment.modelAnswer}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Separator between moments */}
                  {i < report.keyMoments.length - 1 && (
                    <div className="flex justify-center py-8">
                      <div className="w-[80%] border-t border-rule" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Zone 4: Drill Cards ── */}
        {report.topThreeDrills.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-[24px] text-ink" style={{ fontWeight: 400 }}>
              Revisit these tonight.
            </h2>
            {/* Desktop: 3 columns separated by vertical hairlines */}
            <div className="mt-8 flex flex-col sm:flex-row">
              {report.topThreeDrills.map((drill, i) => (
                <div key={drill.topicSlug}>
                  {/* Mobile separator */}
                  {i > 0 && <div className="border-t border-rule sm:hidden" />}
                  <div className={`flex flex-1 flex-col py-6 sm:py-0 ${
                    i > 0 ? 'sm:border-l sm:border-rule sm:pl-8' : ''
                  } ${i < report.topThreeDrills.length - 1 ? 'sm:pr-8' : ''}`}>
                    <span className="font-serif text-[19px] italic text-ink" style={{ fontWeight: 400 }}>
                      {drill.topicName}
                    </span>
                    <p className="mt-2 flex-1 font-serif text-[17px] text-ink-soft" style={{ fontWeight: 400 }}>
                      {drill.reason}
                    </p>
                    <Link
                      href={`/drill?topic=${drill.topicSlug}`}
                      className="group relative mt-4 inline-block font-serif text-[15px] italic text-ink"
                      style={{ fontWeight: 400 }}
                    >
                      Ten-minute drill &rarr;
                      <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Zone 5: Footer Actions ── */}
        <div className="mt-16">
          <div className="border-t border-rule" />
          <div className="flex flex-col items-center pt-8 pb-24">
            <Link
              href="/examination"
              className="group relative font-serif text-[17px] italic text-ink"
              style={{ fontWeight: 400 }}
            >
              Take the chair again &rarr;
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
            </Link>
            <button
              onClick={() => window.print()}
              className="mt-4 font-mono text-[12px] text-ink-muted transition-colors hover:text-ink"
            >
              Save report
            </button>
            <Link
              href="/home"
              className="mt-4 font-mono text-[12px] text-ink-muted transition-colors hover:text-ink"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper
// ---------------------------------------------------------------------------

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ink">
          <p className="font-serif text-[22px] italic text-paper" style={{ fontWeight: 400 }}>
            Marking the paper.
          </p>
        </div>
      }
    >
      <ReportInner />
    </Suspense>
  );
}
